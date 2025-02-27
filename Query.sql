
CREATE DATABASE freelance_jobs;
USE freelance_jobs;

-- Create the jobs table with additional fields for profile image, name, rating, and price
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    profilePic VARCHAR(255),  -- Path to profile picture
    name VARCHAR(100),        -- Name of the person offering the job
    ratings INT,              -- Ratings (as integer values)
    price VARCHAR(50)         -- Price (could be formatted as a string or a numeric value)
);

-- Insert job entries with profile picture, name, rating, and price
INSERT INTO jobs (title, description, category, profilePic, name, ratings, price) VALUES 
('Graphic Designer', 'Create logos, posters, and more.', 'graphic-design', '"C:\Users\swati\OneDrive\Desktop\profilepic - Copy.jpg"', 'John Doe', 5, '$50'),
('Frontend Developer', 'Build responsive websites using React.js.', 'programming', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic - Copy.jpg', 'Alice Smith', 4, '$70'),
('SEO Specialist', 'Optimize website content for search engines.', 'marketing', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic - Copy.jpg', 'Bob Johnson', 4, '$60'),
('Video Editor', 'Create stunning animations and video content.', 'video-animation', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic - Copy.jpg', 'Eva Williams', 5, '$80'),
('AI Developer', 'Build AI-powered applications and models.', 'ai-services', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic - Copy.jpg', 'David Miller', 5, '$120');

-- Use the freelance_jobs database
USE freelance_jobs;
-- Use the freelance_jobs database
USE freelance_jobs;

-- Insert additional job entries for various categories
INSERT INTO jobs (title, description, category, profilePic, name, ratings, price) VALUES 
-- Graphic Design Jobs
('Logo Designer', 'Design professional logos for businesses.', 'graphic-design', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic1.jpg', 'Sophia Brown', 5, '$100'),
('UI/UX Designer', 'Design intuitive and responsive user interfaces.', 'graphic-design', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic2.jpg', 'Emma Johnson', 4, '$120'),
('Illustrator', 'Create stunning illustrations for websites and apps.', 'graphic-design', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic3.jpg', 'Liam Wilson', 5, '$150'),

-- Programming & Tech Jobs
('Backend Developer', 'Develop robust back-end services using Node.js.', 'programming', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic4.jpg', 'James Davis', 4, '$90'),
('Full Stack Developer', 'Build full-stack applications using MERN stack.', 'programming', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic5.jpg', 'Olivia Martin', 5, '$150'),
('Mobile App Developer', 'Create cross-platform mobile apps with Flutter.', 'programming', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic6.jpg', 'Noah Garcia', 5, '$200'),

-- AI Services Jobs
('Machine Learning Engineer', 'Develop AI models using TensorFlow.', 'ai-services', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic7.jpg', 'Mia Rodriguez', 5, '$250'),
('Data Scientist', 'Analyze data and build predictive models.', 'ai-services', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic8.jpg', 'Ethan Hernandez', 4, '$220'),
('NLP Specialist', 'Build natural language processing systems.', 'ai-services', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic9.jpg', 'Ava White', 5, '$300'),

-- Digital Marketing Jobs
('Social Media Manager', 'Manage social media campaigns and engagement.', 'digital-marketing', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic10.jpg', 'Isabella Lee', 4, '$80'),
('Content Marketer', 'Create engaging content to drive traffic.', 'digital-marketing', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic11.jpg', 'Charlotte Hall', 5, '$100'),
('PPC Specialist', 'Manage pay-per-click ad campaigns.', 'digital-marketing', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic12.jpg', 'Lucas Scott', 4, '$90'),

-- Video Animation Jobs
('2D Animator', 'Create 2D animations for marketing and ads.', 'video-animation', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic13.jpg', 'Amelia Young', 5, '$150'),
('Motion Graphics Artist', 'Produce motion graphics for videos.', 'video-animation', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic14.jpg', 'Elijah King', 5, '$180'),
('3D Animator', 'Create 3D animations for films and ads.', 'video-animation', 'C:\\Users\\swati\\OneDrive\\Desktop\\profilepic15.jpg', 'Mason Wright', 5, '$200');

