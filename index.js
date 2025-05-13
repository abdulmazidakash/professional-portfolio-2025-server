const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;


//middleware
app.use(cors());
app.use(express.json());

//send email using nodemailer
// const sendEmail = (emailAddress, emailData) =>{
// 	//create transporter
// 	const transporter = nodemailer.createTransport({
// 		host: "smtp.gmail.com",
// 		port: 587,
// 		secure: false, // true for 465, false for other ports
// 		auth: {
// 		  user: process.env.NODEMAILER_USER,
// 		  pass: process.env.NODEMAILER_PASS,
// 		},
// 	  });

// 	  transporter.verify(error, success =>{
// 		if(error){
// 			console.log(error);
// 		}else{
// 			console.log('Transporter is ready to emails.', success);
// 		}
// 	  });

// 	  const mailBody = {
// 		from: process.env.NODEMAILER_USER,
// 		to: emailAddress,
// 		subject: emailData?.subject,
// 		html: "<b>Hello world?</b>",
// 	  };

// 	  //send email
// 	  transporter.sendMail(mailBody, (error, info) =>{
// 		if(error){
// 			console.log(error);
// 		}else{
// 			console.log('Email sent: ' + info.response);
// 		}
// 	  })
// }


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0hxo.mongodb.net/portfolio-project?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

	const db = client.db('portfolio-project');
	const projectsCollection = db.collection('projects');

	//add project end point
	app.post('/add-project', async(req, res) =>{
		const project = req.body;
		const result = await projectsCollection.insertOne(project);
		res.send(result);
	  });

	  //all data get
	  app.get('/all-project', async (req, res) => {
		try {
			const result = await projectsCollection.find().toArray(); // ✅ convert cursor to array
			res.send(result); // ✅ send the data properly
		} catch (error) {
			console.error("Error fetching projects:", error);
			res.status(500).send({ message: "Failed to fetch projects" });
		}
	});
	  //all data get
	  app.get('/six-project', async (req, res) => {
		try {
			const result = await projectsCollection.find().limit(6).toArray(); // ✅ convert cursor to array
			res.send(result); // ✅ send the data properly
		} catch (error) {
			console.error("Error fetching projects:", error);
			res.status(500).send({ message: "Failed to fetch projects" });
		}
	});

	//details data get
	  app.get('/projects/:id', async(req, res) =>{
		const id = req.params.id;
		console.log(id);
		if (!ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'Invalid ID format' });
		  }
		const query = { _id: new ObjectId(id)};
		const result = await projectsCollection.findOne(query);

		console.log('project single data--->',result);
		res.send(result);
	  });

	  //delete api
	  app.delete('/projects/:id', async (req, res) => {
		const id = req.params.id;
		try {
		  const result = await projectsCollection.deleteOne({ _id: new ObjectId(id) });
		  if (result.deletedCount === 0) {
			return res.status(404).json({ message: 'Project not found' });
		  }
		  res.json({ message: 'Project deleted successfully' });
		} catch (error) {
		  console.error('Error deleting project:', error);
		  res.status(500).json({ message: 'Internal server error' });
		}
	  });

	  //update project

	// PUT: update a project
	app.put('/update-project/:id', async (req, res) => {
		try {
		const { id } = req.params;
		const projectData = req.body;
	
		const filter = { _id: new ObjectId(id) };
		const updateDoc = {
			$set: {
			name: projectData.name,
			description: projectData.description,
			technologies: projectData.technologies,
			imageUrl: projectData.imageUrl,
			liveLink: projectData.liveLink,
			githubLink: projectData.githubLink,
			challenges: projectData.challenges,
			improvements: projectData.improvements,
			date: projectData.date,
			},
		};
	
		const result = await projectsCollection.updateOne(filter, updateDoc);
	
		if (result.modifiedCount === 0) {
			return res.status(404).json({ message: 'No project updated. It may not exist or already be up to date.' });
		}
	
		res.status(200).json({ message: 'Project updated successfully', result });
		} catch (error) {
		console.error('Update error:', error);
		res.status(500).json({ message: 'Failed to update project', error });
		}
	});

	// send email endpoint
	app.post('/send-email', async (req, res) => {
		
		const { name, email, message } = req.body;

	
		const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		secure: false,
		auth: {
			user: process.env.NODEMAILER_USER,
			pass: process.env.NODEMAILER_PASS,
		},
		});

		const htmlTemplate = `
		<div style="font-family: Arial, sans-serif; color: #333;">
		<h2>Portfolio New Message from ${name}</h2>
		<p><strong>Email:</strong> ${email}</p>
		<p><strong>Message:</strong></p>
		<p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${message}</p>
		<hr />
		<p style="font-size: 12px; color: #888;">This email was sent from your portfolio website contact form.</p>
		</div>
	`;
	
	const mailOptions = {
		from: `"Portfolio" ${process.env.NODEMAILER_USER}`,
		to: process.env.NODEMAILER_USER,
		replyTo: email, // ✅ reply will go to user, not yourself
		subject: `Portfolio Message from ${name}`,
		html: htmlTemplate,
	};
	
	
		try {
		await transporter.sendMail(mailOptions);
		res.status(200).send({ message: 'Email sent successfully' });
		} catch (error) {
		console.error("Error sending email:", error);
		res.status(500).send({ message: 'Email sending failed', error });
		}
	});
  

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//test server
app.get('/', (req, res) =>{
	res.send('portfolio server is running');
});

app.listen(port, () =>{
	console.log(`portfolio server is running on port: ${port}`);
})