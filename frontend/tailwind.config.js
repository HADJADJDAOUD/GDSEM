/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  future: {
    disableColorFunctionalOkLch: true, // 👈 stops Tailwind from generating oklch()
  },
};
