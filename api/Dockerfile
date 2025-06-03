# syntax=docker/dockerfile:1
# Stage 1: Build the Go application
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /main .

# Stage 2: Create a minimal runtime image
FROM alpine:3.15
WORKDIR /root/
COPY --from=builder /main .
CMD ["./main"]
