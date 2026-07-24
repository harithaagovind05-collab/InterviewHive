const filter = document.getElementById("difficulty-filter");
const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".problem-card");
const count = document.getElementById("count");

function filterProblems() {

    const difficulty = filter.value.toLowerCase();
    const searchText = searchInput.value.toLowerCase();

    let visible = 0;

    cards.forEach(function(card){

        const title = card.querySelector("h3").textContent.toLowerCase();

        const matchesSearch = title.includes(searchText);

        const matchesDifficulty =
            difficulty === "all" ||
            card.classList.contains(difficulty);

        if(matchesSearch && matchesDifficulty){
            card.style.display = "flex";
            visible++;
        }
        else{
            card.style.display = "none";
        }

    });

    count.textContent = visible;
}

filter.addEventListener("change", filterProblems);

searchInput.addEventListener("keyup", filterProblems);

// Initial count
filterProblems();