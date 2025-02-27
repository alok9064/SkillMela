document.addEventListener("DOMContentLoaded", function() {
    const profilePic = document.getElementById("profile-pic");
    const profileDropdown = document.getElementById("dropdown-menu");
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const logoutMenu = document.getElementById("logout-menu");

    // Toggle profile dropdown
    profilePic.addEventListener("click", function() {
        profileDropdown.style.display = profileDropdown.style.display === "none" ? "flex" : "none";
    });

    // Toggle hamburger menu
    hamburgerMenu.addEventListener("click", function() {
        logoutMenu.style.display = logoutMenu.style.display === "none" ? "flex" : "none";
    });

    // Close dropdowns if clicked outside
    document.addEventListener("click", function(event) {
        if (!profilePic.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.style.display = "none";
        }
        if (!hamburgerMenu.contains(event.target) && !logoutMenu.contains(event.target)) {
            logoutMenu.style.display = "none";
        }
    });
});

// Toggle sub-sidebar visibility
function toggleSubSidebar(subSidebarId) {
    // Close all sub-sidebars first
    closeSubSidebar();

    // Open the selected sub-sidebar
    const subSidebar = document.getElementById(subSidebarId);
    if (subSidebar) {
        subSidebar.classList.add('active');
    }
}

// Close sub-sidebar and show the main sidebar
function closeSubSidebar() {
    // Remove 'active' class from all sub-sidebars
    document.querySelectorAll('.sub-sidebar').forEach(sub => sub.classList.remove('active'));
}


// Show/Edit Profile Form
function showEditProfileForm() {
    document.getElementById('editProfileForm').style.display = 'block';
    document.getElementById('privacySettings').style.display = 'none';
    closeSubSidebar();
}

// Show Privacy Settings
function showPrivacySettings() {
    document.getElementById('privacySettings').style.display = 'block';
    document.getElementById('editProfileForm').style.display = 'none';
    closeSubSidebar();
}

// Submit Profile Form
function submitEditProfile() {
    const formData = new FormData(document.getElementById('profileForm'));
    // Process form data
    alert('Profile updated successfully!');
    document.getElementById('editProfileForm').style.display = 'none';
}

// Submit Privacy Settings
function submitPrivacySettings() {
    alert('Privacy settings updated!');
    document.getElementById('privacySettings').style.display = 'none';
}

// Toggle Like
function toggleLike(button) {
    button.classList.toggle('active');
    const likesCount = button.closest('.post-actions').nextElementSibling.querySelector('.likes-count');
    const currentLikes = parseInt(likesCount.textContent.split(' ')[0]);
    likesCount.textContent = (button.classList.contains('active') ? currentLikes + 1 : currentLikes - 1) + ' Likes';
}

// Toggle Comment Box
function toggleCommentBox(button) {
    const commentBox = button.closest('.post-container').querySelector('.comment-box');
    commentBox.style.display = commentBox.style.display === 'none' ? 'block' : 'none';
}

// Post Comment
function postComment() {
    const commentBox = document.querySelector('.comment-box');
    const commentText = commentBox.querySelector('textarea').value;
    if (commentText) {
        const commentList = commentBox.querySelector('.comments-list');
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.innerHTML = `<strong>You:</strong> ${commentText}`;
        commentList.appendChild(newComment);
        commentBox.querySelector('textarea').value = '';
    }
}

// Show/Create Post Form
function showCreatePostForm() {
    document.getElementById('createPostForm').style.display = 'block';
}

// Submit Post
function submitPost() {
    const postContent = document.getElementById('postContent').value;
    const postMedia = document.getElementById('postMedia').files[0];

    if (postContent || postMedia) {
        // Process the post content and media (e.g., send to server)
        alert('Post submitted successfully!');

        // Clear the form
        document.getElementById('postForm').reset();

        // Hide the form
        document.getElementById('createPostForm').style.display = 'none';
    } else {
        alert('Please write something or upload a file.');
    }
}
