/* =========================================
   SAI UNIVERSITY TIMETABLE
   GOOGLE SHEETS AUTOMATIC DATA
   ========================================= */


/* YOUR GOOGLE SHEET */

const SHEET_ID =
    "1M3jl6_D3EBy-5b1xjv0RLgGaEMymcJAVr9RNnsxkVp0";


/*
   IMPORTANT:

   Change this to the name of the sheet tab
   containing your timetable.

   Example:
   "Sheet1"

   If your tab is named "Timetable",
   change it to:

   const SHEET_NAME = "Timetable";
*/

const SHEET_NAME = "Sheet1";


/*
   Google Sheets CSV URL
*/

const SHEET_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;


/* VARIABLES */

let timetableData = [];

let selectedDay = getToday();

let searchText = "";


/* =========================================
   GET TODAY
   ========================================= */

function getToday() {

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    return days[new Date().getDay()];
}


/* =========================================
   DATE
   ========================================= */

function showDate() {

    const today = new Date();

    document.getElementById("currentDate").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}


/* =========================================
   CSV PARSER
   ========================================= */

function parseCSV(text) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const char = text[i];

        const next = text[i + 1];


        if (char === '"' && insideQuotes && next === '"') {

            value += '"';

            i++;

        }

        else if (char === '"') {

            insideQuotes = !insideQuotes;

        }

        else if (char === "," && !insideQuotes) {

            row.push(value.trim());

            value = "";

        }

        else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }

            row = [];

            value = "";

        }

        else {

            value += char;

        }

    }


    if (value || row.length) {

        row.push(value.trim());

        if (row.some(cell => cell !== "")) {
            rows.push(row);
        }

    }


    return rows;
}


/* =========================================
   FIND COLUMN
   ========================================= */

function findColumn(headers, possibleNames) {

    for (let i = 0; i < headers.length; i++) {

        const header =
            headers[i].toLowerCase().trim();

        for (const name of possibleNames) {

            if (header.includes(name)) {
                return i;
            }

        }

    }

    return -1;
}


/* =========================================
   LOAD GOOGLE SHEET
   ========================================= */

async function loadGoogleSheet() {

    const loading =
        document.getElementById("loading");

    const error =
        document.getElementById("error");


    loading.style.display = "block";

    error.style.display = "none";


    try {

        const response = await fetch(
            SHEET_URL + "&cache=" + Date.now()
        );


        if (!response.ok) {

            throw new Error(
                "Unable to access Google Sheet"
            );

        }


        const csv = await response.text();


        const rows = parseCSV(csv);


        if (rows.length < 2) {

            throw new Error(
                "No timetable data found"
            );

        }


        const headers = rows[0];


        /*
          Automatically search for columns.

          Your headers can be:

          Date
          Day
          Time
          Subject
          Faculty
          Room

          or similar names.
        */


        const dateColumn = findColumn(
            headers,
            ["date"]
        );


        const dayColumn = findColumn(
            headers,
            ["day", "weekday"]
        );


        const timeColumn = findColumn(
            headers,
            ["time", "timing"]
        );


        const subjectColumn = findColumn(
            headers,
            ["subject", "course", "class"]
        );


        const facultyColumn = findColumn(
            headers,
            ["faculty", "teacher", "professor", "instructor"]
        );


        const roomColumn = findColumn(
            headers,
            ["room", "classroom", "venue", "location"]
        );


        timetableData = [];


        for (let i = 1; i < rows.length; i++) {

            const row = rows[i];


            const date =
                dateColumn >= 0
                    ? row[dateColumn] || ""
                    : "";


            const day =
                dayColumn >= 0
                    ? row[dayColumn] || ""
                    : "";


            const time =
                timeColumn >= 0
                    ? row[timeColumn] || ""
                    : "";


            const subject =
                subjectColumn >= 0
                    ? row[subjectColumn] || ""
                    : "";


            const faculty =
                facultyColumn >= 0
                    ? row[facultyColumn] || ""
                    : "";


            const room =
                roomColumn >= 0
                    ? row[roomColumn] || ""
                    : "";


            /*
               Ignore completely empty rows
            */

            if (
                !date &&
                !day &&
                !time &&
                !subject
            ) {
                continue;
            }


            timetableData.push({

                date: date,

                day: day,

                time: time,

                subject: subject,

                faculty: faculty,

                room: room

            });

        }


        loading.style.display = "none";


        document.getElementById(
            "lastUpdated"
        ).textContent =
            "Updated: " +
            new Date().toLocaleTimeString(
                "en-IN"
            );


        displayTimetable();


    }

    catch (err) {

        console.error(err);


        loading.style.display = "none";


        error.style.display = "block";


        error.innerHTML = `

            <strong>Unable to load timetable.</strong>

            <br><br>

            Make sure your Google Sheet is public
            or published to the web.

            <br><br>

            Also check the SHEET_NAME in script.js.

        `;

    }

}


/* =========================================
   DISPLAY TIMETABLE
   ========================================= */

function displayTimetable() {

    const container =
        document.getElementById("timetable");


    container.innerHTML = "";


    let classes =
        timetableData.filter(item => {

            return normalizeDay(item.day)
                === normalizeDay(selectedDay);

        });


    /*
       SEARCH
    */

    if (searchText) {

        classes = classes.filter(item => {

            return (

                item.subject
                    .toLowerCase()
                    .includes(searchText.toLowerCase())

                ||

                item.faculty
                    .toLowerCase()
                    .includes(searchText.toLowerCase())

                ||

                item.room
                    .toLowerCase()
                    .includes(searchText.toLowerCase())

            );

        });

    }


    document.getElementById(
        "selectedDay"
    ).textContent = selectedDay;


    document.getElementById(
        "description"
    ).textContent =
        `Classes for ${selectedDay}`;


    document.getElementById(
        "classCount"
    ).textContent =
        classes.length;


    if (classes.length > 0) {

        document.getElementById(
            "firstClass"
        ).textContent =
            classes[0].time || "--";

    }

    else {

        document.getElementById(
            "firstClass"
        ).textContent =
            "--";

    }


    /*
       NO CLASSES
    */

    if (classes.length === 0) {

        container.innerHTML = `

            <div class="empty">

                <h3>📚 No classes found</h3>

                <p>
                    No timetable entries are available
                    for ${selectedDay}.
                </p>

            </div>

        `;

        return;

    }


    /*
       CREATE CLASS CARDS
    */

    classes.forEach(item => {

        const card =
            document.createElement("div");


        card.className =
            "class-card";


        card.innerHTML = `

            <div class="class-time">

                ⏰ ${escapeHTML(item.time)}

            </div>


            <div>

                <div class="subject">

                    ${escapeHTML(item.subject)}

                </div>


                ${
                    item.faculty
                    ?
                    `<div class="faculty">
                        👨‍🏫 ${escapeHTML(item.faculty)}
                    </div>`
                    :
                    ""
                }

            </div>


            ${
                item.room
                ?
                `<div class="room">
                    📍 ${escapeHTML(item.room)}
                </div>`
                :
                `<div class="room">
                    📍 —
                </div>`
            }

        `;


        container.appendChild(card);

    });

}


/* =========================================
   NORMALIZE DAY
   ========================================= */

function normalizeDay(day) {

    if (!day) return "";


    return day
        .toString()
        .trim()
        .toLowerCase();

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   DAY BUTTONS
   ========================================= */

document
    .querySelectorAll(".day-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".day-btn")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add("active");


                selectedDay =
                    button.dataset.day;


                displayTimetable();

            }
        );

    });


/* =========================================
   TODAY
   ========================================= */

document
    .getElementById("todayBtn")
    .addEventListener(
        "click",
        () => {

            const today =
                getToday();


            if (today === "Sunday") {

                alert(
                    "Today is Sunday. No regular classes."
                );

                return;

            }


            selectedDay = today;


            document
                .querySelectorAll(".day-btn")
                .forEach(button => {

                    button.classList.remove(
                        "active"
                    );


                    if (
                        button.dataset.day
                        === today
                    ) {

                        button.classList.add(
                            "active"
                        );

                    }

                });


            displayTimetable();

        }
    );


/* =========================================
   SEARCH
   ========================================= */

document
    .getElementById("search")
    .addEventListener(
        "input",
        event => {

            searchText =
                event.target.value;

            displayTimetable();

        }
    );


/* =========================================
   MANUAL REFRESH
   ========================================= */

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        () => {

            loadGoogleSheet();

        }
    );


/* =========================================
   DARK MODE
   ========================================= */

document
    .getElementById("themeBtn")
    .addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            document.getElementById(
                "themeBtn"
            ).textContent =
                dark ? "☀️" : "🌙";

        }
    );


/* =========================================
   AUTOMATIC REFRESH
   ========================================= */

/*
   Reload Google Sheet every 5 minutes.

   5 minutes = 300000 milliseconds
*/

setInterval(
    loadGoogleSheet,
    5 * 60 * 1000
);


/* =========================================
   START
   ========================================= */

showDate();


/*
   If today is Monday-Saturday,
   automatically select today's day.
*/

if (
    selectedDay !== "Sunday"
) {

    document
        .querySelectorAll(".day-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.day
                === selectedDay
            ) {

                button.classList.add(
                    "active"
                );

            }

        });

}


/*
   First load
*/

loadGoogleSheet();