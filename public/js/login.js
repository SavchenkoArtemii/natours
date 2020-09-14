const axios = require("axios");

const login = async (email, password) => {
    const res = await axios({
        method: "POST",
        url: "http://127.0.0.1:3000/api/v1/users/login",
        data: {
            email,
            password
        }
    })
    console.log(result);
}

if (document.querySelector(".form")) {
    document.querySelector(".form").addEventListener("submit", (event => {
        event.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        login(email, password);
    }))
}
