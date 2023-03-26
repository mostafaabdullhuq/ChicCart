/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./views/**/*.{html,js,ejs}", "./views/*.{html,js,ejs}"],
    theme: {
        extend: {
            display: ["group-hover"],
        },
        container: {
            center: true,
            padding: "1rem",
        },
    },
    plugins: [require("tailwind-scrollbar-hide")],
};
