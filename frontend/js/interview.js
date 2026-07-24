const startButton = document.getElementById("start-btn");

startButton.addEventListener("click", function(){

    const language = document.getElementById("language").value;
    const difficulty = document.getElementById("difficulty").value;
    const mode = document.querySelector('input[name="mode"]:checked');

    if(language === ""){
        alert("Please select a programming language.");
        return;
    }

    if(difficulty === ""){
        alert("Please select a difficulty level.");
        return;
    }

    if(mode === null){
        alert("Please select an interview mode.");
        return;
    }

    alert(
        "🚀 Interview Starting!\n\n" +
        "Language: " + language +
        "\nDifficulty: " + difficulty +
        "\nMode: " + mode.value
    );

});