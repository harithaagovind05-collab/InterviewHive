// ==============================
// Progress Bar
// ==============================

const percent = 60;

document.getElementById("progress-percent").textContent = percent + "%";
document.getElementById("progress-fill").style.width = percent + "%";

// ==============================
// Weekly Problems Chart
// ==============================

const weeklyCtx = document.getElementById("weeklyChart");

new Chart(weeklyCtx, {

    type: "line",

    data: {

        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

        datasets: [{

            data: [2, 4, 3, 5, 6, 4, 7],

            borderColor: "#8B5CF6",

            backgroundColor: "rgba(139,92,246,0.18)",

            fill: true,

            tension: 0.5,

            pointRadius: 5,

            pointHoverRadius: 8,

            pointBackgroundColor: "#8B5CF6",

            pointBorderColor: "#FFFFFF",

            pointBorderWidth: 2

        }]

    },

    options: {

        responsive: true,

        animation: {

            duration: 1800,

            easing: "easeOutQuart"

        },

        plugins: {

            legend: {

                display: false

            }

        },

        scales: {

            x: {

                ticks: {

                    color: "white"

                },

                grid: {

                    color: "#1E293B"

                }

            },

            y: {

                beginAtZero: true,

                ticks: {

                    color: "white",

                    stepSize: 1

                },

                grid: {

                    color: "#1E293B"

                }

            }

        }

    }

});

// ==============================
// Difficulty Distribution Chart
// ==============================

const difficultyCtx = document.getElementById("difficultyChart");

new Chart(difficultyCtx, {

    type: "doughnut",

    data: {

        labels: ["Easy", "Medium", "Hard"],

        datasets: [{

            data: [45, 35, 20],

            backgroundColor: [

                "#22C55E",

                "#F59E0B",

                "#EF4444"

            ],

            borderColor: "#111827",

            borderWidth: 3,

            hoverOffset: 10

        }]

    },

    options: {

        responsive: true,

        animation: {

            duration: 1800,

            easing: "easeOutQuart"

        },

        plugins: {

            legend: {

                display: false

            }

        },

        cutout: "48%"

    }

});