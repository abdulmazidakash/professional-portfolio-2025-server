const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;


//middleware
app.use(cors());
app.use(express.json());


//test server
app.get('/', (req, res) =>{
	res.send('portfolio server is running');
});

app.listen(port, () =>{
	console.log(`portfolio server is running on port: ${port}`);
})