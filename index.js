import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import path from 'path';
import pg from "pg";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import multer from 'multer';
import { profile } from "console";
import ejs from 'ejs';


const app = express();
const port = 3000;
const saltRounds = 10;

// Convert __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


env.config();
console.log("Database URL:", process.env.DATABASE_URL);


// Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());


// const db = new pg.Client({
//   connectionString: process.env.DATABASE_URL
// });

// db.connect()
//   .then(() => console.log('Connected to Database'))
//   .catch(err => console.error('Connection Error:', err));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

// Configure Nodemailer for sending OTP via Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'alok.burnpur@gmail.com',
      pass: process.env.pass
  }
});

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Function to send OTP email
async function sendOtpEmail(email, otp) {
  try {
      if (!email) {
          throw new Error('Recipient email is undefined');
      }

      await transporter.sendMail({
          from: '"SkillMela" alok.burnpur@gmail.com', // Replace with your email
          to: email,
          subject: 'Your OTP Code',
          text: `Your OTP code is ${otp}. It is valid for 1 minute 30 seconds.`,
      });
      console.log('OTP email sent successfully');
  } catch (error) {
      console.error('Error sending OTP email:', error);
  }
};
// Path for email template files
const templatePath = path.join(__dirname, 'views', 'email-templates', 'job-offer-template.ejs');

// Function to generate stars
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  let starHtml = '';

  for (let i = 0; i < fullStars; i++) {
      starHtml += '★';
  }
  if (halfStar) {
      starHtml += '☆';
  }
  for (let i = 0; i < emptyStars; i++) {
      starHtml += '☆';
  }

  return starHtml;
}


// middleware
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT * FROM user_profiles WHERE user_id = $1", [req.user.id]);
      req.profile = result.rows[0]; // Attach profile data to req.profile
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }
  next(); // Proceed to the next middleware or route handler
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ 
  storage:storage, 
  dest: 'public/uploads',
  limits: { fileSize: 20 * 1024 * 1024 }, });// Limit size to 20MB

// GET ROUTES 

app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("home.ejs", { profile: req.profile, user: req.user });
      } else {
        res.render("home.ejs");
      }
});

app.get("/role", (req, res) => {
      res.render("role.ejs");
});

app.get("/home", async (req, res) => {
  if (req.isAuthenticated()) {
      res.render("home.ejs", { profile: req.profile, user: req.user });
    } else {
      res.render("home.ejs");
    }
});

app.get("/learn", (req, res) => {
    if (req.isAuthenticated()) {
      res.render("learn.ejs", { profile: req.profile, user: req.user });
    } else {
        res.render("signin.ejs");
    }
});

app.get("/practice", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("practice.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("signin.ejs");
  }
});

app.get("/practice-start", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("practice-start.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("practice-start.ejs");
  }
});

app.get("/mentorship", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("mentorship.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("mentorship.ejs");
  }
});

app.get("/compete", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("compete.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("signin.ejs");
  }
});

app.get("/contest1", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("contest1.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("contest1.ejs");
  }
});

app.get("/contest2", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("contest2.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("contest2.ejs");
  }
});
const categories = [
  { name: 'Web Development', active: true },
  { name: 'Mobile App Development', active: false },
  { name: 'Data Science', active: false },
  { name: 'Graphic Design', active: false },
  { name: 'AI Services', active: false }
];

app.get("/freelancing", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const job_id = req.query.job_id;
      // Fetch the jobs posted by the client from the database using the status === open
      const result = await db.query('SELECT * FROM jobs ORDER BY job_id DESC');
      const jobs = result.rows;
      const clientResult = await db.query('SELECT * FROM client_profiles WHERE client_id = $1', [jobs[0].client_id]);
      const client_ = clientResult.rows[0];
      res.render("freelancing.ejs", {
        profile: req.profile, 
        user: req.user,
        jobs,
        client_,
        generateStars
    });
    } catch (error) {
      console.error("Error fetching client profile:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
      res.render("signin.ejs");
  }
});

app.get('/job-details/:job_id', async (req, res) => {
  if (req.isAuthenticated()) {
    const jobId = req.params.job_id; // Get the job ID from the URL
    console.log("jobId:", jobId);
    try {
      // Fetch the details of the job using the job_id
      const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
      
      // Check if the job exists
      if (jobResult.rows.length > 0) {
        const job = jobResult.rows[0];
        
        // Fetch client details if necessary (assuming client info might come from another table)
        const clientResult = await db.query('SELECT * FROM client_profiles WHERE client_id = $1', [job.client_id]);
        const client = clientResult.rows[0];

        // Render the job details page with the job and client data
        res.render('job-details.ejs', {
          profile: req.profile, 
          user: req.user,
          job: job,
          client_: client,
          generateStars
        });
      } else {
        res.status(404).send("Job not found.");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("signin.ejs");
  }
});

app.post('/send-proposal/:job_id', async (req, res) => {
  if (req.isAuthenticated()) {
      const jobId = req.params.job_id;
      const freelancerId = req.user.id; // Assuming `req.user` contains the authenticated freelancer's info
      const { proposal_text, bid_amount, delivery_days } = req.body;

      try {
        const query = `
            INSERT INTO proposals 
            (job_id, freelancer_id, proposal_text, bid_amount, delivery_days)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(proposal_id) DO UPDATE
            SET 
              proposal_text = EXCLUDED.proposal_text,
              bid_amount = EXCLUDED.bid_amount,
              delivery_days = EXCLUDED.delivery_days
        `;
        const values = [
          jobId, freelancerId, proposal_text, bid_amount, delivery_days
        ];
        // Insert the proposal into the database
        await db.query(query, values);

        // Updating the no. of proposals in the jobs table
        const jobResult = await db.query("SELECT proposals FROM jobs WHERE job_id = $1", [jobId]);
        const job = jobResult.rows[0];
        var proposal_count = job.proposals + 1;  
        await db.query("UPDATE jobs SET proposals = $1 WHERE job_id = $2", [proposal_count, jobId]);

        // Redirect to a success page or back to the job details page
        res.redirect(`/freelancing`);
      } catch (error) {
          console.error("Error submitting proposal:", error);
          res.status(500).send("Internal Server Error");
      }
  } else {
      res.redirect("/signin");
  }
});

// NOTIFICATION page for job-offers of freelancers
app.get('/job-offers', async (req, res) => {
  if (req.isAuthenticated()) {
    const freelancerId = req.user.id;

    try {
        const offersResult = await db.query(
            'SELECT h.hire_id, j.title AS job_title, c.full_name AS name, h.scope, h.deadline FROM hires h JOIN jobs j ON h.job_id = j.job_id JOIN client_profiles c ON j.client_id = c.client_id WHERE h.user_id = $1 AND h.status = $2 ORDER BY hire_id DESC',
            [freelancerId, 'pending']
        );

        const offers = offersResult.rows;

        res.render('job-offers.ejs', { 
          offers, 
          profile: req.profile, 
          user: req.user 
        });
    } catch (error) {
        console.error('Error fetching offers', error);
        res.status(500).send('Server Error');
    }
  } else {
    res.redirect("/signin");
  }
});

// Accept Offer
// Path to the EJS template
const templatePath_accept = path.join(__dirname, 'views', 'email-templates', 'offer-accepted.ejs');

app.post('/job-offers/:hireId/accept', async (req, res) => {
    const { hireId } = req.params;

    try {
        // Update the status of the hire
        const result = await db.query(
            'UPDATE hires SET status = $1 WHERE hire_id = $2 RETURNING *',
            ['accepted', hireId]
        );

        const hire = result.rows[0];
        const jobId = hire.job_id;
        const freelancerId = hire.user_id;

        // Update the job status
        await db.query("UPDATE jobs SET status = $1 WHERE job_id = $2", ['closed', jobId]);

        // Fetch client and freelancer details
        const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
        const clientResult = await db.query('SELECT * FROM client_profiles WHERE client_id = (SELECT client_id FROM jobs WHERE job_id = $1)', [jobId]);
        const freelancerResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [freelancerId]);

        const job = jobResult.rows[0];
        const client = clientResult.rows[0];
        const freelancer = freelancerResult.rows[0];

        await db.query('INSERT INTO projects (hire_id, job_id, title, description, client_id, freelancer_id) VALUES($1, $2, $3, $4, $5, $6)', [hireId, job.job_id, job.title, job.description, client.client_id, freelancer.user_id])

        const emailData = {
            clientName: client.full_name,
            freelancerName: freelancer.first_name,
            jobTitle: job.title,
            scope: hire.scope,
            milestones: hire.milestones,
            deadline: hire.deadline
        };

        // Render the EJS template
        ejs.renderFile(templatePath_accept, emailData, async (err, emailHtml) => {
            if (err) {
                console.error('Error rendering EJS template:', err);
                return res.status(500).send('Server Error');
            }

            // Define email options
            let mailOptions = {
                from: 'alok.burnpur@gmail.com',
                to: client.email,
                subject: 'Freelancer Acceptance Notification',
                html: emailHtml
            };

            // Send the email
            try {
                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully');
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                return res.status(500).send('Error sending email');
            }

            // Redirect to project dashboard
            res.redirect(`/project-dashboard/${hireId}`);
        });
    } catch (error) {
        console.error('Error accepting offer', error);
        res.status(500).send('Server Error');
    }
});


// Reject Offer
app.post('/job-offers/:hireId/reject', async (req, res) => {
  const { hireId } = req.params;

  try {
      await db.query('UPDATE hires SET status = $1 WHERE hire_id = $2', ['rejected', hireId]);

      // Redirect back to the offers page
      res.redirect('/job-offers.ejs');
  } catch (error) {
      console.error('Error rejecting offer', error);
      res.status(500).send('Server Error');
  }
});

// PROJECT DASHBOARD FOR FREELANCER
app.get('/project-dashboard/:userId', async (req, res) => {

  const userId = req.user.id;

  try {
    // Fetch project details by userId
    const projectResult = await db.query('SELECT * FROM projects WHERE freelancer_id = $1', [userId]);
    const project = projectResult.rows[0];

    // Fetch job details related to the project
    const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [project.job_id]);
    const job = jobResult.rows[0];

    // Fetch client and freelancer details
    const clientResult = await db.query('SELECT * FROM client_profiles WHERE client_id = $1', [project.client_id]);
    const freelancerResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [project.freelancer_id]);
    const client = clientResult.rows[0];
    const freelancer = freelancerResult.rows[0];

    // Fetch messages

    // const messagesResult = await db.query('SELECT * FROM messages WHERE project_id = $1 ORDER BY sent_at ASC', [project.id]);
    // const messages = messagesResult.rows;

    // Fetch milestones for the project
    const milestonesResult = await db.query(
      'SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date ASC',
      [project.id]
    );
    const milestones = milestonesResult.rows;

    // Render the project-dashboard.ejs 
    res.render('project-dashboard.ejs', {
      project,
      job,
      user: req.user,
      userId,
      client,
      freelancer,
      milestones
      // messages
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).send('Server Error');
  }

});

app.post('/milestone/update/:milestoneId', async (req, res) => {
  const { milestoneId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  try {
    // Update the status of the specific milestone
    await db.query(
      'UPDATE project_milestones SET status = $1 WHERE id = $2',
      [status, milestoneId]
    );
    res.redirect(`/project-dashboard/${userId}`);  // Redirect back to the project dashboard
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).send('Server Error');
  }
});


app.post('/project/send-message', async (req, res) => {
  const { projectId, message } = req.body;

  // Insert new message
  await db.query('INSERT INTO messages (project_id, sender, text, sent_at) VALUES ($1, $2, $3, NOW())', 
                 [projectId, 'Client', message]);

  // Redirect back to the dashboard
  res.redirect(`/project-dashboard/${hireId}`);
});

app.get("/social", async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("social.ejs", { profile: req.profile, user: req.user });
  } else {
      res.render("signin.ejs");
  }
});

app.get("/signin", (req, res) => {
    res.render("signin.ejs");
});

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  app.get("/client-profile/:clientId", async (req, res) => {
    if (req.isAuthenticated()) {
      const clientId = req.user.id;
  
      try {
        // Fetch the client profile using the clientId
        const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
        const client_profile = result.rows[0];
  
        if (!client_profile) {
          return res.status(404).send("Client profile not found.");
        }
        // Fetch jobs posted by the client from the database
      const checkResult = await db.query('SELECT title, proposals FROM jobs WHERE client_id = $1', [clientId]);
  
      const jobs = checkResult.rows;
        res.render("client-profile.ejs", { 
          client_profile,  // Passing the client_profile object
          client: req.user,
          clientId,// Passing the authenticated user object
          jobs,
          generateStars
        });
      } catch (error) {
        console.error("Error fetching client profile:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.redirect("/signin");
    }
  });

  // Route to upload Client profile photo
  app.post('/upload-cl-profile-photo/:clientId', upload.single('profilePhoto'), async (req, res) => {
    const clientId = req.params.clientId;
    const profilePhotoPath = `/uploads/${req.file.filename}`;
    try {
      await db.query("UPDATE client_profiles SET profile_photo = $1 WHERE client_id = $2", [profilePhotoPath, clientId]);
      res.redirect(`/client-profile/${clientId}`);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // GET EDIT CLIENT PROFILE
  app.get("/edit-client-profile/:clientId", async (req, res) => {
    if (req.isAuthenticated()) {
      const clientId = req.user.id;
      try {
        // Fetch the client profile using the clientId
        const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
        const client_profile = result.rows[0];

        if (!client_profile) {
          return res.status(404).send("Client profile not found.");
        }
        // Fetch jobs posted by the client from the database
        const checkResult = await db.query('SELECT title, proposals FROM jobs WHERE client_id = $1', [clientId]);
        const jobs = checkResult.rows;
        res.render("edit-client-profile.ejs", { 
          client_profile,  
          client: req.user,
          clientId,
          jobs
        });
      } catch (error) {
        console.error("Error fetching client profile:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.redirect("/signin");
    }
  });

  app.post('/client-details', async (req, res) => {
    const {
        client_id, full_name, pronoun, bio, about, location_city, location_state, location_country, full_address,
        company_name, business_type, company_website, project_types,
        freelancer_categories, expected_project_size, email, phone, whatsapp,
        linkedin, instagram, twitter
    } = req.body;
    const clientId = req.user.id;
    try {
        const query = `
            INSERT INTO client_profiles 
            (client_id, full_name, pronoun, bio, about, location_city, location_state, location_country, full_address,
             company_name, business_type, company_website, project_types, freelancer_categories, 
             expected_project_size, email, phone, whatsapp, linkedin, instagram, twitter)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (client_id) DO UPDATE
            SET 
              full_name = EXCLUDED.full_name,
              pronoun = EXCLUDED.pronoun,
              bio = EXCLUDED.bio,
              about = EXCLUDED.about,
              location_city = EXCLUDED.location_city,
              location_state = EXCLUDED.location_state,
              location_country = EXCLUDED.location_country,
              full_address = EXCLUDED.full_address,
              company_name = EXCLUDED.company_name,
              business_type = EXCLUDED.business_type,
              company_website = EXCLUDED.company_website,
              project_types = EXCLUDED.project_types, 
              freelancer_categories = EXCLUDED.freelancer_categories, 
              expected_project_size = EXCLUDED.expected_project_size, 
              email = EXCLUDED.email, 
              phone = EXCLUDED.phone, 
              whatsapp = EXCLUDED.whatsapp, 
              linkedin = EXCLUDED.linkedin, 
              instagram = EXCLUDED.instagram, 
              twitter = EXCLUDED.twitter
        `;
        const values = [
            client_id, full_name, pronoun, bio, about, location_city, location_state, location_country, full_address,
            company_name, business_type, company_website, {project_types},
            freelancer_categories, expected_project_size, email, phone, whatsapp,
            linkedin, instagram, twitter
        ];

        await db.query(query, values);
        res.redirect(`/client-profile/${clientId}`);
    } catch (err) {
        console.error(err);
        res.send('Error while saving client details.');
    }
});

// CLIENT SETTING
app.get("/client-settings/:clientId", async (req, res) => {
  if (req.isAuthenticated()) {
    const clientId = req.user.id;

    try {
      // Fetch the client profile using the clientId
      const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
      const client_profile = result.rows[0];

      if (!client_profile) {
        return res.status(404).send("Client profile not found.");
      }

      // Render the client-profile.ejs page
      res.render("client-settings.ejs", { 
        client_profile,  // Passing the client_profile object
        client: req.user // Passing the authenticated user object
      });
    } catch (error) {
      console.error("Error fetching client profile:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/signin");
  }
});
// CLIENT HOME
app.get("/client-home/:clientId", async (req, res) => {
  if (req.isAuthenticated()) {
    const clientId = req.user.id;

    try {
      // Fetch the client profile using the clientId
      const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
      const client_profile = result.rows[0];

      if (!client_profile) {
        return res.status(404).send("Client profile not found.");
      }
      // Fetch jobs posted by the client from the database
    const checkResult = await db.query('SELECT * FROM jobs WHERE client_id = $1 ORDER BY job_id DESC', [clientId]);
    const jobs = checkResult.rows;
    let hireId = [];

    if (jobs.length > 0) {
      const hireResult = await db.query("SELECT hire_id FROM projects WHERE job_id = $1", [jobs[0].job_id]);
      hireId = hireResult.rows;
    } else {
      console.log("No jobs found for this client.");
    }

    // const hireId = await db.query("SELECT hire_id FROM projects WHERE job_id = $1", [jobs[0].job_id]);
      res.render("client-home.ejs", { 
        client_profile,  // Passing the client_profile object
        client: req.user,
        clientId,// Passing the authenticated user object
        jobs,
        hireId
      });

    } catch (error) {
      console.error("Error fetching client profile:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/signin");
  }
});

// GET route for job page
app.get('/job/:clientId', async (req, res) => {
  if (req.isAuthenticated()) {
    const clientId = req.user.id;
    try {
      // Fetch the client profile using the clientId
      const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
      const client_profile = result.rows[0];

      if (!client_profile) {
        return res.status(404).send("Client profile not found.");
      }
      const checkResult = await db.query('SELECT * FROM jobs WHERE client_id = $1 ORDER BY job_id DESC', [clientId]);
      const jobPosts = checkResult.rows;
      res.render('job.ejs', { 
        jobPosts,
        client_profile,  // Passing the client_profile object
        client: req.user,
        clientId // Passing the authenticated user object
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  } else {
    res.redirect("/signin");
  }
});

// POST route for posting a job
app.post('/post-job', upload.array('projectFiles', 10), async (req, res) => {
  const { projectName, projectDescription, proj_category, skills, min_price, max_price } = req.body;
  const uploadedPhotos = req.files.map(file => `/uploads/${file.filename}`);
  const clientId = req.user.id;
  const result = await db.query("SELECT full_name, profile_photo FROM client_profiles WHERE client_id = $1", [clientId]);
  const checkResult = result.rows[0];
  const client_name = checkResult.full_name;
  const client_photo = checkResult.profile_photo;
  try {
    await db.query(
      'INSERT INTO jobs (client_id, title, description, proj_category, skills, image_paths, client_name, client_photo, min_price, max_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [clientId, projectName, projectDescription, proj_category, Array.isArray(skills) ? skills : [skills], uploadedPhotos, client_name, client_photo, min_price, max_price]
    );
    res.redirect(`/job/${clientId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

//Applicants-proposals

app.get('/applicants/:jobId', async (req, res) => {
  if (req.isAuthenticated() && req.user.role === 'client') {
      const jobId = req.params.jobId;
      const clientId = req.user.id; // `req.user` contains the authenticated client's info

      try {
          // Fetch the job to ensure the client owns it
          const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1 AND client_id = $2', 
                                           [jobId, clientId]);
          if (jobResult.rows.length === 0) {
              return res.status(403).send("You are not authorized to view this page.");
          }
          // Fetching proposal & freelancer details
          const proposalsResult = await db.query(`
              SELECT p.proposal_text, p.created_at, p.bid_amount, p.delivery_days, f.user_id, f.first_name, f.last_name, f.profile_photo, f.city, f.country, f.rating, f.rating_count
              FROM proposals p
              JOIN user_profiles f ON p.freelancer_id = f.user_id
              WHERE p.job_id = $1`, 
              [jobId]);
          const proposals = proposalsResult.rows;
           
          // Fetch the client profile using the clientId
          const profileResult = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
          const client_profile = profileResult.rows[0];

          // Render the review-proposals page with the proposals data
          res.render('applicants.ejs', { 
            proposals, 
            job: jobResult.rows[0],
            client: req.user,
            client_profile,
            generateStars 
          });

      } catch (error) {
          console.error("Error fetching proposals:", error);
          res.status(500).send("Internal Server Error");
      }
  } else {
      res.redirect("/signin");
  }
});

// GET Hire Confirmation Page
app.get('/hire-confirmation/:userId/:jobId', async (req, res) => {
  const { userId, jobId } = req.params;

  try {
      // Fetch job details and freelancer details from DB
      const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
      const freelancerResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
      
      const job = jobResult.rows[0];
      const freelancer = freelancerResult.rows[0];
      
      res.render('hire-confirmation.ejs', { job, freelancer });
  } catch (error) {
      console.error('Error fetching data', error);
      res.status(500).send('Server Error');
  }
});

// POST Hire Freelancer
app.post('/hire/:userId/:jobId', async (req, res) => {
  const { userId, jobId } = req.params;
  const { scope, milestones, deadline } = req.body;

  try {
      // Insert into hiring table (or update job with hired freelancer)
      await db.query(
          'INSERT INTO hires (job_id, user_id, scope, milestones, deadline, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [jobId, userId, scope, milestones, deadline, 'pending']
      );

      // Fetch job and freelancer details
      const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
      const job = jobResult.rows[0];

      const freelancerResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]); 
      const freelancer = freelancerResult.rows[0];
      const freelancerEmail = freelancer.email;

      
      const clientResult = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [job.client_id]);
      const client = clientResult.rows[0];
      
      const hireResult = await db.query("SELECT * FROM hires WHERE job_id = $1", [jobId]);
      const hires = hireResult.rows[0];
      const hireId = hires.hire_id;

      // Render the EJS template with dynamic data
      ejs.renderFile(templatePath, { job, freelancer, client, hires, hireId }, async (err, emailHtml) => {
          if (err) {
              console.error('Error rendering EJS template:', err);
              return res.status(500).send('Server Error');
          }

          // Define email options
          let mailOptions = {
              from: 'alok.burnpur@gmail.com',
              to: freelancerEmail,
              subject: 'New Job Offer on SkillMela',
              html: emailHtml // Use rendered HTML as the email body
          };

          // Send the email
          try {
              await transporter.sendMail(mailOptions);
              console.log('Email sent successfully');
          } catch (emailError) {
              console.error('Error sending email:', emailError);
              return res.status(500).send('Error sending email');
          }
          // Redirect to the project dashboard (or confirmation page)
          res.redirect(`/client-home/${client.client_id}`);
          
      });
      
  } catch (error) {
    console.error('Error creating hire', error);
      res.status(500).send('Server Error');
  }
});

    

// PROJECT DASHBOARD FOR CLIENT
app.get('/client-proj-dashboard/:userId', async (req, res) => {

  const userId = req.user.id;

  try {
    // Fetch project details by userId
    const projectResult = await db.query('SELECT * FROM projects WHERE client_id = $1', [userId]);
   
    const project = projectResult.rows[0];

    // Fetch job details related to the project
    const jobResult = await db.query('SELECT * FROM jobs WHERE job_id = $1', [project.job_id]);
    const job = jobResult.rows[0];

    // Fetch client and freelancer details
    const clientResult = await db.query('SELECT * FROM client_profiles WHERE client_id = $1', [project.client_id]);
    const freelancerResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [project.freelancer_id]);
    const client = clientResult.rows[0];
    const freelancer = freelancerResult.rows[0];

    // Fetch bid_amount
    const proposalsResult = await db.query('SELECT * FROM proposals WHERE job_id = $1', [project.job_id]);
    const proposal = proposalsResult.rows[0];
    // Fetch messages
    // const messagesResult = await db.query('SELECT * FROM messages WHERE project_id = $1 ORDER BY sent_at ASC', [project.id]);
    // const messages = messagesResult.rows;

    // Fetch milestones for the project
    const milestonesResult = await db.query(
      'SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date ASC',
      [project.id]
    );
    const milestones = milestonesResult.rows;

    // Fetch the rating for the user from the database
    const ratingResult = await db.query('SELECT rating FROM freelancer_ratings WHERE rated_id = $1 AND rater_id = $2 ORDER BY id DESC', [userId, freelancer.user_id]);
    const userRating = ratingResult.rows[0]?.rating || 0;  // Default to 0 if no rating

    // Render the project-dashboard.ejs 
    res.render('client-proj-dashboard.ejs', {
      project,
      job,
      user: req.user,
      userId,
      client,
      freelancer,
      milestones,
      proposal,
      userRating
      // messages
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).send('Server Error');
  }

});

app.post('/milestone/add', async (req, res) => {
  const { project_id, milestone_name, due_date } = req.body;
  console.log("proj_od", project_id);

  try {
    // Insert the new milestone
    await db.query(
      'INSERT INTO project_milestones (project_id, name, due_date, status) VALUES ($1, $2, $3, $4)',
      [project_id, milestone_name, due_date, 'pending']
    );
    res.redirect(`/client-proj-dashboard/${project_id}`);
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).send('Server Error');
  }
});

app.post('/rate/:ratedId', async (req, res) => {
  const raterId = req.body.raterId;  // ID of the user giving the rating
  const ratedId = req.params.ratedId;  // ID of the user being rated
  const rating = parseInt(req.body.rating);  // Value from 1 to 5

  // Insert the rating into the ratings table
  await db.query(
      'INSERT INTO freelancer_ratings (rater_id, rated_id, rating) VALUES ($1, $2, $3)',
      [raterId, ratedId, rating]
  );

  // Update the average rating and count for the rated user
  await db.query(
      `UPDATE user_profiles 
       SET rating = (SELECT AVG(rating) FROM freelancer_ratings WHERE rated_id = $1),
           rating_count = (SELECT COUNT(*) FROM freelancer_ratings WHERE rated_id = $1)
       WHERE user_id = $1`,
      [ratedId]
  );

  res.redirect('back');
});

//talents
app.get('/talents', async (req, res) => {
  if (req.isAuthenticated()) {
    const clientId = req.user.id;
    try {
      const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
      const client_profile = result.rows[0];

      if (!client_profile) {
        return res.status(404).send("Client profile not found.");
      }

      res.render('talents.ejs', { 
        client: req.user,
        client_profile,
        clientId
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  } else {
    res.redirect("/talents");
  }
});
// FIND FREELANCERS
app.get('/find-freelancers', async (req, res) => {
  if (req.isAuthenticated()) {
    const clientId = req.user.id;
    try {
      const result = await db.query("SELECT * FROM client_profiles WHERE client_id = $1", [clientId]);
      const client_profile = result.rows[0];

      if (!client_profile) {
        return res.status(404).send("Client profile not found.");
      }

      res.render('find-freelancers.ejs', { 
        client: req.user,
        client_profile,
        clientId
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  } else {
    res.redirect("/signin");
  }
});

 // FREELANCER'S PROFILE 
  app.get("/manage-portfolio/:userId", async (req, res) => {
    if (req.isAuthenticated()) {
    const userId = req.params.userId;

    try {
        const port_result = await db.query("SELECT * FROM portfolio_items WHERE user_id = $1", [userId]); //  to get the portfolio items
        const portfolioItems = port_result.rows;
        res.render("manage-portfolio.ejs", { 
          profile :req.profile, 
          user: req.user,
          portfolioItems
         });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Internal Server Error');
    }
  } else {
          res.redirect("/signin");
    }
  });
  
  
// Route to display profile page
app.get("/profile/:userId", async (req, res) => {
  if (req.isAuthenticated()) {
  const userId = req.params.userId;
  console.log(userId);
  try {
      const result = await db.query("SELECT * FROM user_profiles WHERE user_id = $1", [userId]);
      const profile = result.rows[0];
      const port_result = await db.query("SELECT * FROM portfolio_items WHERE user_id = $1", [userId]); //  to get the portfolio items
      const portfolioItems = port_result.rows;

      res.render("profile.ejs", { 
        profile, 
        user: req.user,
        portfolioItems,
        generateStars
       });
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Internal Server Error');
  }
} else {
        res.redirect("/signin");
  }
});

// Route to display edit profile page
app.get("/edit-profile/:userId", async (req, res) => {
  if (req.isAuthenticated()) {
  const userId = req.params.userId;
  try {
      const result = await db.query("SELECT * FROM user_profiles WHERE user_id = $1", [userId]);
      const profile = result.rows[0];
      res.render("edit-profile.ejs", { profile, user: req.user});
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Internal Server Error');
  }
  }else {
      res.redirect("/signin");
  }
});

// Route to save profile changes
app.post('/save-profile', async (req, res) => {
  const { user_id, first_name, last_name, bio, about, country, city, full_address } = req.body;
  try {
      await db.query(`
          INSERT INTO user_profiles (user_id, first_name, last_name, bio, about, country, city, full_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id) DO UPDATE
          SET first_name = EXCLUDED.first_name,
              last_name = EXCLUDED.last_name,
              bio = EXCLUDED.bio,
              about = EXCLUDED.about,
              country = EXCLUDED.country,
              city = EXCLUDED.city,
              full_address = EXCLUDED.full_address;
      `, [user_id, first_name, last_name, bio, about, country, city, full_address]);
      res.redirect(`/profile/${user_id}`);
  } catch (error) {
      console.error('Error saving profile:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to upload profile photo
app.post('/upload-profile-photo/:userId', upload.single('profilePhoto'), async (req, res) => {
  const userId = req.params.userId;
  const profilePhotoPath = `/uploads/${req.file.filename}`;
  try {
    await db.query("UPDATE user_profiles SET profile_photo = $1 WHERE user_id = $2", [profilePhotoPath, userId]);
    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to upload cover photo
app.post('/upload-cover-photo/:userId', upload.single('coverPhoto'), async (req, res) => {
  const userId = req.params.userId;
  const coverPhotoPath = `/uploads/${req.file.filename}`;
  try {
    await db.query("UPDATE user_profiles SET cover_photo = $1 WHERE user_id = $2", [coverPhotoPath, userId]);
    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error('Error updating cover photo:', error);
    res.status(500).send('Internal Server Error');
  }
});
// portfolio-management 
app.post('/portfolio/add/:userId', upload.single('uploadFile'), async (req, res) => {
  const userId = req.params.userId;
  const { title, description, contentType, codeSample, article } = req.body;
  const uploadFilePath = `/uploads/${req.file.filename}`;
  try {
    // if (req.file) {
    // }

    // Save portfolio item to DB
    await db.query(`
      INSERT INTO portfolio_items (user_id, title, description, content_type, code_sample, article_content, file_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
      [userId, title, description, contentType, codeSample || null, article || null, uploadFilePath]);

    res.redirect(`/profile/${userId}`); // Redirect to profile page after saving
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving portfolio item.");
  }
});
  
app.get('/auth/google', (req, res, next) => {
  const role = req.query.role;  // Get role from query params or session
  const state = JSON.stringify({ role });  // Encode state as JSON
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: state  // Pass state to Google
  })(req, res, next);
});

  app.get(
    "/auth/google/callback",
      passport.authenticate("google", {
      // successRedirect: "/home",
        failureRedirect: "/signin",
      }), (req, res) => {
        if (req.user.role === "freelancer") {
          res.redirect("/home");
        } else if (req.user.role === "client"){
          res.redirect(`/client-home/${req.user.id}`);
        }
  });

  app.post(
    "/signin",
    passport.authenticate("local", {
      failureRedirect: "/signin",
    }),
    (req, res) => {
      if (req.user.role === "freelancer") {
        res.redirect("/home");
      } else {
        res.redirect(`/client-home/${req.user.id}`);
      }
    }
  );
  

//send otp to email
  app.post('/send-otp', async (req, res) => {
    const email = req.body.username; // Ensure this is correct field name
    req.session.email = email;
    // const role = req.body.role; 
    const otp = generateOTP();
    const expiration = new Date(Date.now() + 90 * 1000); // OTP valid for 1 min 30 seconds
    console.log('Email received:', email);

    try {
        // Store OTP and expiration in the database
        await db.query('INSERT INTO users (otp, otp_expiration) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET otp = $1, otp_expiration = $2',
            [otp, expiration]);

        // Send OTP via email
        await sendOtpEmail(email, otp);

        res.status(200).send('OTP sent');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error sending OTP');
    }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  const email = req.body.username;
  req.session.email = email;
  const otp = req.body.otp;

  db.query('SELECT otp, otp_expiration FROM users WHERE otp = $1', [otp], (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
          // const { otp: storedOtp, otp_expiration: expiration } = result.rows[0]; //same syntax below
          const storedOtp = result.rows[0].otp;
          const expiration = result.rows[0].otp_expiration;

          if (otp === storedOtp && new Date() < expiration) {
              res.json({ success: true });       
          } else {
              // res.json({ success: false });
              res.locals.error("OTP do not match or has expired.")
              return res.render("signup.ejs", { error: "OTP do not match or OTP expired." });
          }
      } else {
          res.json({ success: false });
      }
  });
});

  app.post("/signup", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const role = req.body.role;  // Get role from the form
    req.session.role = role;  // Store role in session  
    const otp = req.body.otp;
   
    console.log("role:", role);
    console.log("email:", email);
    console.log("password", password);
    console.log("confirmpass:", confirmPassword);

    if (!role) {
      return res.redirect("/signup");
    }
  
    try {
      if (password !== confirmPassword) {
        res.locals.error("Passwords do not match")
        return res.render("signup.ejs", { error: "Passwords do not match." });
      }
  
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  
      if (checkResult.rows.length > 0) {
        res.redirect("/signin");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "UPDATE users SET email = $1, password = $2, role = $3 WHERE otp = $4 RETURNING *",
              [email, hash, role, otp]
            );
            const user = result.rows[0];
            const userId = user.id;
  
            // Create profiles based on role
            if (role === 'freelancer') {
              await db.query(`INSERT INTO user_profiles (user_id, first_name, last_name, email)
                              VALUES ($1, '', '', $2)`, [userId], [email]);
            } else if (role === 'client') {
              await db.query(`INSERT INTO client_profiles (client_id, company_name)
                              VALUES ($1, '')`, [userId]);             
            }
  
            req.login(user, (err) => {
              if (err) {
                console.log(err);
                res.redirect("/signin");
              } else {
                // Redirect to different home pages based on role
                if (role === 'freelancer') {
                  res.redirect("/home");
                } else if (role === 'client') {
                  res.redirect("/client-home/" + userId);
                }
              }
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  

  

  passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
          username,
        ]);
      
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );
  
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
        passReqToCallback: true,  // Enable passing req to the callback

      },
      async (req, accessToken, refreshToken, profile, cb) => {
        try {

          // const state = JSON.parse(req.query.state);  // Parse the state parameter
          // const role = state.role;  // Retrieve the role from state
          // req.session.role = role;  // Store role in session if needed
          const role = req.session.role;  
          // Retrieve the role from session
          
          console.log("pass_role:", role);
          console.log("Access Token:", accessToken);
          console.log("Profile:", profile);   
          const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.emails[0].value,]);
          if (result.rows.length === 0) {
            const newUser = await db.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",[profile.emails[0].value, "google", role]);
            return cb(null, newUser.rows[0]);
          } else {
            return cb(null, result.rows[0]);
          }
        } catch (err) {
          console.log("OAuth Error:", err);
          console.log(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

          return cb(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
  


app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});