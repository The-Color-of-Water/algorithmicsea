
//check if the user has manually selected the language
var lang = localStorage.getItem("language");
// console.log("Stored language", lang);
if(lang == null) {
    //auto detect from the browser settings
    var userLang = navigator.language || navigator.userLanguage; 
    var lang = userLang.startsWith("pt") ? "pt" : "en";
    // console.log("Auto recognized language", lang);
    localStorage.setItem("language", lang);
}

//redirect if the page is different from the language detected
var filename = window.location.pathname;
if(lang == "en" && filename.includes("pt")){
    // console.log("Redirecting to EN");
    window.location.replace("index.html");
} else if(lang == "pt" && !filename.includes("pt")){
    // console.log("Redirecting to PT");
    window.location.replace("index-pt.html");
}

//store the manually selected language on the cookies
addEventListener("DOMContentLoaded", (event) => {
    var languageEl = document.getElementById("language");
    languageEl.onclick = function(){
        if(lang == "pt"){
            localStorage.setItem("language", "en");
        }else if(lang == "en"){
            localStorage.setItem("language", "pt");
        }
    }
});