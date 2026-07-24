<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | InterviewHive</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">

    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="css/login.css">

</head>

<body>

    <div class="login-container">

        <div class="login-card">

            <a href="index.html" class="back-home">
                ← Back to Home
            </a>

            <h1>InterviewHive</h1>

            <h2>Welcome Back 👋</h2>

            <p class="subtitle">
                Continue your interview preparation journey.
            </p>

            <form id="loginForm">

                <label>Email</label>

                <input
                    type="email"
                    id="email"
                    placeholder="Enter your email">

                <small class="error" id="emailError"></small>

                <label>Password</label>

                <div class="password-box">

                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password">

                    <button
                        type="button"
                        id="togglePassword"
                        class="eye-btn">
                        👁
                    </button>

                </div>

                <small class="error" id="passwordError"></small>

                <div class="options">

                    <label class="remember">

                        <input type="checkbox">

                        Remember Me

                    </label>

                    <a href="#">Forgot Password?</a>

                </div>

                <button
                    type="submit"
                    class="login-btn">
                    Login
                </button>

            </form>

            <p class="signup">

                Don't have an account?

                <a href="register.html">
                    Sign Up
                </a>

            </p>

        </div>

    </div>

    <script src="js/login.js"></script>

</body>

</html>