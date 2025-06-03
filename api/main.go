package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/gocql/gocql"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/mailgun/mailgun-go/v4"
)

var apiKey = os.Getenv("MAILGUN_API_KEY")
var host = os.Getenv("DB_HOST")

func main() {

	// Database
	systemCluster := gocql.NewCluster(host)
	systemCluster.Consistency = gocql.Quorum

	session, err := systemCluster.CreateSession()
	if err != nil {
		log.Fatal(err)
	}
	defer session.Close()

	//language=cassandraql
	err = session.Query(`CREATE KEYSPACE IF NOT EXISTS VICTORY WITH REPLICATION = {'class': 'NetworkTopologyStrategy', 'datacenter1': 2 };`).Exec()
	if err != nil {
		log.Fatal(err)
	}

	// EMAIL_PAIRS TABLE

	//language=cassandraql
	err = session.Query(`CREATE TABLE IF NOT EXISTS VICTORY.EMAIL_PAIRS (PUB TEXT, EMAIL TEXT PRIMARY KEY, ALIAS TEXT, CREATED_AT TIMESTAMP);`).Exec()
	if err != nil {
		log.Fatal(err)
	}

	// VERIFY_REGISTRATION TABLE

	//language=cassandraql
	err = session.Query(`CREATE TABLE IF NOT EXISTS VICTORY.VERIFY_REGISTRATION(CODE SMALLINT PRIMARY KEY, PUB TEXT, ALIAS TEXT, EMAIL TEXT);`).Exec()
	if err != nil {
		log.Fatal(err)
	}

	// VERIFY_UPDATE TABLE

	//language=cassandraql
	err = session.Query(`CREATE TABLE IF NOT EXISTS VICTORY.VERIFY_UPDATE(CODE SMALLINT PRIMARY KEY, PUB TEXT, ISALIAS BOOLEAN, VALUE TEXT);`).Exec()
	if err != nil {
		log.Fatal(err)
	}

	// API

	app := fiber.New()

	// Create a log file
	file, err := os.OpenFile("fiber.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Add logger middleware
	app.Use(logger.New(logger.Config{
		Output: file,
		Format: "[${time}] ${status} - ${method} ${path}\n",
	}))

	app.Use(cors.New())

	app.Post("/api/v1/validate", func(ctx *fiber.Ctx) error {
		type Pub struct {
			Pub string `json:"pub"`
		}

		var data Pub
		if err := ctx.BodyParser(&data); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Unable to parse JSON",
			})
		}

		var count int
		//language=cassandraql
		err = session.Query(`SELECT COUNT(*) FROM victory.email_pairs WHERE pub = ? ALLOW FILTERING`, data.Pub).Scan(&count)
		if err != nil {
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		if count == 0 {
			return ctx.SendStatus(fiber.StatusNotFound)
		} else {
			return ctx.SendStatus(fiber.StatusOK)
		}
	})

	app.Post("/api/v1/register", func(ctx *fiber.Ctx) error {
		type User struct {
			Pub   string `json:"pub"`
			Alias string `json:"alias"`
			Email string `json:"email"`
		}

		var data User
		data.Email = strings.ToLower(data.Email)
		data.Alias = strings.ToLower(data.Alias)

		if err := ctx.BodyParser(&data); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Unable to parse JSON",
			})
		}

		var count int

		//language=cassandraql
		err = session.Query("SELECT count(*) FROM victory.EMAIL_PAIRS WHERE ALIAS = ? ALLOW FILTERING ", data.Alias).Scan(&count)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}
		if count != 0 {
			return ctx.SendStatus(fiber.StatusConflict)
		}

		//language=cassandraql
		err = session.Query("SELECT count(*) FROM victory.EMAIL_PAIRS WHERE email = ? ALLOW FILTERING ", data.Email).Scan(&count)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}
		if count != 0 {
			return ctx.SendStatus(fiber.StatusConflict)
		}

		code := generateCode()

		var existingCode int

		// --- Check and Delete by ALIAS ---
		//language=cassandraql
		// Check if a record with the given alias exists and retrieve its CODE (primary key)
		err = session.Query("SELECT CODE FROM victory.VERIFY_REGISTRATION WHERE ALIAS = ? ALLOW FILTERING ", data.Alias).Scan(&existingCode)
		if err != nil {
			if err == gocql.ErrNotFound { // Handle "not found" explicitly from gocql driver
				log.Info("No record found for alias:", data.Alias) // Log info, not an error
			} else {
				// Handle other potential errors during the SELECT query (e.g., connection issues)
				log.Error("Error checking for existing alias:", err)
				return ctx.SendStatus(fiber.StatusInternalServerError) // Return error status to the client
			}
		} else {                   // No error during SELECT, record might exist (or default value if Scan fails to populate)
			if existingCode != 0 { // Check if a code was found (assuming 0 is not a valid code)
				//language=cassandraql
				// Delete the record using the retrieved CODE (primary key)
				delErr := session.Query("DELETE FROM victory.VERIFY_REGISTRATION WHERE CODE = ?", existingCode).Exec()
				if delErr != nil {
					// Handle errors during deletion
					log.Error("Error deleting record by CODE for alias:", delErr)
					return ctx.SendStatus(fiber.StatusInternalServerError) // Return error status
				} else {
					log.Info("Successfully deleted record by CODE for alias:", data.Alias, " CODE:", existingCode) // Log successful deletion
				}
			} else {
				log.Info("No record found for alias (after scan):", data.Alias) // Log if scan didn't populate existingCode
			}
		}

		// --- Check and Delete by EMAIL ---
		// Reset existingCode before re-using it for the email check
		existingCode = 0

		//language=cassandraql
		// Check if a record with the given email exists and retrieve its CODE (primary key)
		err = session.Query("SELECT CODE FROM victory.VERIFY_REGISTRATION WHERE EMAIL = ? ALLOW FILTERING ", data.Email).Scan(&existingCode)
		if err != nil {
			if errors.Is(err, gocql.ErrNotFound) { // Handle "not found" explicitly from gocql driver
				log.Info("No record found for email:", data.Email) // Log info, not an error
			} else {
				// Handle errors during SELECT
				log.Error("Error checking for existing email:", err)
				return ctx.SendStatus(fiber.StatusInternalServerError) // Return error status
			}
		} else {                   // No error during SELECT, record might exist
			if existingCode != 0 { // Check if a code was found
				//language=cassandraql
				// Delete the record using the retrieved CODE (primary key)
				delErr := session.Query("DELETE FROM victory.VERIFY_REGISTRATION WHERE CODE = ?", existingCode).Exec()
				if delErr != nil {
					// Handle deletion errors
					log.Error("Error deleting record by CODE for email:", delErr)
					return ctx.SendStatus(fiber.StatusInternalServerError) // Return error status
				} else {
					log.Info("Successfully deleted record by CODE for email:", data.Email, " CODE:", existingCode) // Log successful deletion
				}
			} else {
				log.Info("No record found for email (after scan):", data.Email) // Log if scan didn't populate existingCode
			}
		}

		//language=cassandraql
		err = session.Query("INSERT INTO victory.VERIFY_REGISTRATION(CODE, PUB, ALIAS, EMAIL) VALUES (?, ?, ?, ?) USING TTL 900", code, data.Pub, data.Alias, data.Email).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		err = checkValidEmailDomain(data.Email)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
		}

		err = sendCode(data.Email, data.Alias, code, true)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		return ctx.SendStatus(fiber.StatusOK)
	})

	app.Post("/api/v1/update", func(ctx *fiber.Ctx) error {
		type Update struct {
			Pub     string `json:"pub"`
			IsAlias bool   `json:"isAlias"`
			Value   string `json:"value"`
		}

		var data Update
		if err := ctx.BodyParser(&data); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Unable to parse JSON",
			})
		}

		code := generateCode()

		//language=cassandraql
		err = session.Query("DELETE FROM victory.verify_update WHERE PUB = ?", data.Pub).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		var email string
		var alias string
		//language=cassandraql
		err = session.Query("SELECT EMAIL FROM victory.email_pairs WHERE PUB = ?", data.Pub).Scan(&email, &alias)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		//language=cassandraql
		err = session.Query("INSERT INTO victory.verify_update(CODE, PUB, ISALIAS, VALUE) VALUES (?, ?, ?, ?) USING TTL 900", code, data.Pub, data.IsAlias, data.Value).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		err = checkValidEmailDomain(email)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		err = sendCode(email, alias, code, false)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		return ctx.SendStatus(fiber.StatusOK)
	})

	app.Get("/api/v1/user", func(ctx *fiber.Ctx) error {
		email := ctx.Query("email") // Extract email from query parameter

		if email == "" { // Check if email query parameter is present
			return ctx.Status(fiber.StatusBadRequest).SendString("Email query parameter is required")
		}

		email = strings.ToLower(email) // Convert email to lowercase

		var alias string
		//language=cassandraql
		err := session.Query("SELECT ALIAS FROM victory.email_pairs WHERE email = ?", email).Scan(&alias)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		return ctx.SendString(alias)
	})

	app.Post("/api/v1/verify-registration", func(ctx *fiber.Ctx) error {
		type Code struct {
			Code int `json:"code"`
		}

		var data Code
		err = ctx.BodyParser(&data)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		var pub, alias, email string
		//language=cassandraql
		err = session.Query("SELECT PUB, ALIAS, EMAIL FROM victory.verify_registration WHERE CODE = ?", data.Code).Scan(&pub, &alias, &email)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		//language=cassandraql
		err = session.Query("INSERT INTO victory.email_pairs (PUB, ALIAS, EMAIL, CREATED_AT) VALUES (?, ?, ?, toTimestamp(now()))", pub, alias, email).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		//language=cassandraql
		err = session.Query("DELETE FROM victory.verify_registration WHERE CODE = ?", data.Code).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		return ctx.SendStatus(fiber.StatusOK)
	})

	app.Post("/api/v1/verify-update", func(ctx *fiber.Ctx) error {
		type Code struct {
			Code int `json:"code"`
		}

		var data Code
		err = ctx.BodyParser(&data)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		var pub, value string
		var isAlias bool
		//language=cassandraql
		err = session.Query("SELECT PUB, ISALIAS, VALUE FROM victory.verify_update WHERE CODE = ?", data.Code).Scan(&pub, &isAlias, &value)
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		if isAlias {
			//language=cassandraql
			err = session.Query("UPDATE victory.email_pairs SET alias = ? WHERE pub = ?", value, pub).Exec()
			if err != nil {
				log.Error(err)
				return ctx.SendStatus(fiber.StatusInternalServerError)
			}
		} else {
			//language=cassandraql
			err = session.Query("UPDATE victory.email_pairs SET email = ? WHERE pub = ?", value, pub).Exec()
			if err != nil {
				log.Error(err)
				return ctx.SendStatus(fiber.StatusInternalServerError)
			}
		}

		//language=cassandraql
		err = session.Query("DELETE FROM victory.verify_update WHERE CODE = ?", data.Code).Exec()
		if err != nil {
			log.Error(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		return ctx.SendStatus(fiber.StatusOK)
	})

	err = app.Listen(":3001")
	if err != nil {
		log.Fatal(err)
	}
}

func checkValidEmailDomain(email string) error {
	whitelist := []string{
		"gmail.com", "googlemail.com",
		"proton.me", "protonmail.com", "pm.me", "protonmail.ch",
	}

	// Split the email at '@' and check if the last part is a valid domain
	parts := strings.Split(email, "@")
	emailDomain := ""
	if len(parts) > 1 {
		emailDomain = parts[len(parts)-1]
	}

	for _, domain := range whitelist {
		if emailDomain == domain {
			return nil // Valid domain, do nothing
		}
	}

	return errors.New("please use a Gmail or Proton Mail domain")
}

func sendCode(email string, user string, code string, isRegistration bool) error {

	mg := mailgun.NewMailgun("mail.victoryapp.net", apiKey)

	message := mailgun.NewMessage(
		"Victory <no-reply@mail.victoryapp.net>",
		"Verify Email Address for Victory",
		"",
		email,
	)

	var bodyContent string
	if isRegistration {
		bodyContent = "Thanks for registering for an account on Victory! Before we get started, we just need to confirm that this is you. Enter the code below to verify your email address:"
	} else {
		bodyContent = "We received a request to change your info on Victory! Before we get started, we just need to confirm that this is you. If you didn’t request an info change, you can ignore this message and continue to use your account like normal."
	}
	//language=html
	body := fmt.Sprintf(`
		<html lang="en" >
		<head>
			<!-- Include the Google Fonts link -->
			<link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
		</head>
			<table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0">
				<td align="center" style="background-color:#e5e5e5">
				<body style="min-width:320px; max-width:620px; height: 45rem; background: #101014; font-family: 'Lato', sans-serif; color: white;">
					<table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" >
					
						<tr>
							<td align="center">
								<table role="presentation" width="50%%" border="0" cellspacing="0" cellpadding="0">
									<tr>
										<td align="center" style="padding-top: 2rem;">
											<a href="https://victoryapp.net" style="text-align: center; color: white; font-size: 0; font-weight: bold; text-decoration: none;">
												<span style="display: inline-block; padding-right: 0.02rem; margin: 0; font-size: 3rem; font-family: 'Open Sans', sans-serif;">V</span>
											</a>
										</td>
									</tr>
									<tr>
										<td>
											<h1 style= "text-align: center; color: white;  padding-top: 0.2rem; padding-bottom: 0.8rem; font-size: 1.8rem;">Hey, %s</h1>
											<h1 style= "text-align: center; color: white; padding-bottom: 2rem; font-size: 0.9rem; font-weight: normal;">%s</h1>
										</td>
									</tr>
									<tr>
										<td align="center" style="display: inline-block; padding: 1rem; background: #252528; border-radius: 0.375rem;">
											<h1 style="font-size: 1.5rem; font-weight: 700; color: white;">Verification Code</h1>
											<table class="color: #9ca3af;" role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0">
												<tr>
													<td align="center" style="">
														<h1 style="text-align:center; background:#101014; border-radius:0.375rem; margin: 1rem 1rem 1rem 1rem; padding: 0.8rem 0.7rem 0.7rem;">%s</h1>
													</td>
													<td align="center" style="">
														<h1 style="text-align:center; background:#101014; border-radius:0.375rem; margin: 1rem 1rem 1rem 1rem; padding: 0.8rem 0.7rem 0.7rem;">%s</h1>
													</td>
													<td align="center" style="">
														<h1 style="text-align:center; background:#101014; border-radius:0.375rem; margin: 1rem 1rem 1rem 1rem; padding: 0.8rem 0.7rem 0.7rem;">%s</h1>
													</td>
													<td align="center" style="">
														<h1 style="text-align:center; background:#101014; border-radius:0.375rem; margin: 1rem 1rem 1rem 1rem; padding: 0.8rem 0.7rem 0.7rem;">%s</h1>
													</td>
												</tr>
											</table>
										</td>
										<td style="display: inline-block;">
											<h1 style= "user-select: none; padding-top: 0.5rem; font-weight: normal; font-size: 0.75rem; line-height: 1rem;">Verification codes expire after 15 mins.</h1>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</body>
				</td>
			</table>
		</html>
		`, user, bodyContent, string(code[0]), string(code[1]), string(code[2]), string(code[3]))

	message.SetHTML(body)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	_, _, err := mg.Send(ctx, message)

	if err != nil {
		return err
	}

	return nil
}

func generateCode() string {
	source := rand.NewSource(time.Now().UnixNano())
	random := rand.New(source)

	code := fmt.Sprintf("%04d", random.Intn(10000))

	return code
}
