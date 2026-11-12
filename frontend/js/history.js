// ===========================
// SEARCH FUNCTION
// ===========================

const searchInput = document.getElementById("searchInput");
const tableRows = document.querySelectorAll("#historyTable tr");

searchInput.addEventListener("keyup", function () {

    const searchText = searchInput.value.toLowerCase();
    let visibleRows = 0;

    tableRows.forEach(function(row){

        const language = row.children[1].textContent.toLowerCase();

        if(language.includes(searchText)){

            row.style.display = "";
            visibleRows++;

        }else{

            row.style.display = "none";

        }

    });

    document.getElementById("totalInterviews").textContent = visibleRows;

});

// ===========================
// VIEW BUTTON
// ===========================

const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach(function(button){

    button.addEventListener("click", function(){

        alert("Interview Report feature will be added in the next step!");

    });

});