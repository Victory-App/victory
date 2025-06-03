const express = require('express')
const Gun = require('gun');


const app = express()
const gun = Gun({
    web: app.listen(8765),
});
