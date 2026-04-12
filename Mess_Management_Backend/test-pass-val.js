const axios = require('axios');

async function testPasswordValidation() {
    const testCases = [
        { password: "a", expected: "Password must be at least 8 characters long" },
        { password: "123", expected: "Password must be at least 8 characters long" },
        { password: "onlynumbers123", expected: "contain both letters and numbers" },
        { password: "onlyletters", expected: "contain both letters and numbers" },
        { password: "ValidPass123", expected: "OTP sent" } // Should pass to the next stage (OTP)
    ];

    for (const test of testCases) {
        try {
            console.log(`Testing: "${test.password}"`);
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name: "Test User",
                rollNo: "12345",
                email: "test@iitk.ac.in",
                password: test.password
            });
            console.log(`Result: ${response.data.message || response.data.error}\n`);
        } catch (error) {
            console.log(`Result: ${error.response ? error.response.data.error : error.message}\n`);
        }
    }
}

testPasswordValidation();
