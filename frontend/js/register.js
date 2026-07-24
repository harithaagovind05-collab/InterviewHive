// Password Toggle

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }

});

toggleConfirmPassword.addEventListener("click", () => {

    if (confirmPassword.type === "password") {
        confirmPassword.type = "text";
    } else {
        confirmPassword.type = "password";
    }

});
const form = document.getElementById("registerForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = password.value;
    const confirm = confirmPassword.value;

    document.getElementById("nameError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("passwordError").textContent = "";
    document.getElementById("confirmError").textContent = "";

    let valid = true;

    if (name === "") {
        document.getElementById("nameError").textContent = "Enter your name";
        valid = false;
    }

    if (email === "") {
        document.getElementById("emailError").textContent = "Enter your email";
        valid = false;
    } else if (!email.includes("@")) {
        document.getElementById("emailError").textContent = "Enter a valid email";
        valid = false;
    }

    if (pass.length < 6) {
        document.getElementById("passwordError").textContent =
            "Password must be at least 6 characters";
        valid = false;
    }

    if (pass !== confirm) {
        document.getElementById("confirmError").textContent =
            "Passwords do not match";
        valid = false;
    }

    if (valid) {

        alert("Account created successfully!");

        window.location.href = "login.html";

    }

});