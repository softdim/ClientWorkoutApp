let BIN_ID;
let API_KEY;
let DATA;

const DATE_OBJ = new Date();

const DATE = DATE_OBJ.toLocaleDateString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric'
});

const DAY = DATE_OBJ.getDay();

let EXERCISE;
let SET_COUNT;
let WEIGHT_BUFFER;
let KEYPAD_VALUE = 0;
let KEYPAD_STATE = 0;

let UNSAVED = false;

function unsave_data() {
	document.getElementById("save_button").style.display = "block";
	UNSAVED = true;
}

function render_select_exercise() {
	let s = '';
	
	for (const exercise of DATA.split[DAY])
		s += `<div class=menu_button onclick="select_exercise('${exercise}')">${exercise}</div>`;
	s += `<div class=menu_button onclick="render_all_exercises()">More...</div>`;
	
	document.getElementById("select_exercise").innerHTML = s;
}

function render_all_exercises() {
	let s = '';
	
	for (let i = 0;  i < 7; i++) {
		for (const exercise of DATA.split[i])
			s += `<div class=menu_button onclick="select_exercise('${exercise}')">${exercise}</div>`;
	}
	s += `<div class=menu_button onclick="render_select_exercise()">Less...</div>`;
	
	document.getElementById("select_exercise").innerHTML = s;
}

function render_log_exercise() {
	let set = SET_COUNT + 1;
	let pr = get_pr(EXERCISE);
	let rm = get_8rm(EXERCISE);
	
	document.getElementById("log_stats").innerText = `${EXERCISE} | Set: ${set} | PR: ${pr} | 8RM: ${rm}`;
	
	let weight_kpd = document.getElementById("weight_keypad");
	let reps_kpd = document.getElementById("reps_keypad");
	let log_view = document.getElementById("log_view");
	let prompt;
	if (KEYPAD_STATE != 0) {
		prompt = "REPS";
		reps_kpd.style.display = "block";
		weight_kpd.style.display = "none";
		log_view.style.display = "none";
	} else {
		prompt = "WEIGHT";
		weight_kpd.style.display = "block";
		log_view.style.display = "block";
		reps_kpd.style.display = "none";
	}
	document.getElementById("log_prompt").innerText = prompt;
	
	document.getElementById("log_view").innerText = KEYPAD_VALUE.toString();
	
	console.log(DATA);
}

let timer;
let remaining = 120;

function start_timer(seconds = 120) {
    clearInterval(timer);

    remaining = seconds;
    document.getElementById("remaining_time").textContent = remaining;
	
	document.getElementById("log_countdown").style.display = "block";

    select_menu('log_exercise');

    timer = setInterval(loop_timer, 1000);
}

function loop_timer() {
    remaining--;

    document.getElementById("remaining_time").textContent = remaining;

    if (remaining <= 0) {
        end_timer();
    }
}

function end_timer() {
    clearInterval(timer);
    timer = null;

    document.getElementById("remaining_time").textContent = 0;
	
	document.getElementById("log_countdown").style.display = "none";
}

function keypad_press(btn) {
	if (btn == "RESET") KEYPAD_VALUE = 0;
	else if (btn == "ENTER") {
		WEIGHT_BUFFER = KEYPAD_VALUE;
		KEYPAD_VALUE = 0;
		KEYPAD_STATE = 1;
	} else if (btn == "x2") {
		KEYPAD_VALUE *= 2;
	} else if (btn == "2.5") {
		KEYPAD_VALUE += 2.5;
	} else {
		KEYPAD_VALUE += parseInt(btn);
	}
	render_log_exercise();
}

function history_get(date) {
	for(const session of DATA.history)
		if (session.date == date)
			return session;
	return null;
}

function keypad_set_reps(reps) {
	let session = history_get(DATE);
	if(!session) {
		session = {date:DATE, workouts:[]};
		DATA.history.push(session);
	}
	
	let workout;
	for (const workout2 of session.workouts) {
		if(workout2.name == EXERCISE) {
			workout = workout2;
			break;
		}
	}
	if (!workout) {
		workout = {name: EXERCISE, sets: []}
		session.workouts.push(workout)
	}
	
	workout.sets.push({weight:WEIGHT_BUFFER, reps:reps});
	
	SET_COUNT++;
	KEYPAD_VALUE = 0;
	KEYPAD_STATE = 0;
	unsave_data();
	render_log_exercise();
	start_timer();
}

function get_pr(exercise) {
	let pr = 0;
	for (const session of DATA.history) {
		for (const workout of session.workouts) {
			if (workout.name != exercise) continue;
			for (set of workout.sets) {
				if (set.weight > pr) pr = set.weight;
			}
		}
	}
	return pr;
}

function get_8rm(exercise) {
	let pr = 0;
	for (const session of DATA.history) {
		for (const workout of session.workouts) {
			if (workout.name != exercise) continue;
			for (set of workout.sets) {
				if (set.weight > pr && set.reps >= 8) pr = set.weight;
			}
		}
	}
	return pr;
}

function render_weight_record() {
	let s = "";
	for(const entry of DATA.weight) {
		s = `${entry.date} | ${entry.value}\n` + s;
	}
	document.getElementById("weight_history").innerText = s;
}

let LOGGED_WEIGHT = false;
function log_weight() {
	if (LOGGED_WEIGHT) {alert("You can only log your weight once per session."); return;}
	
	let weight = prompt("Enter scale weight:");
	if (!weight || weight=='') return;
	
	console.log(weight);
	DATA.weight.push({date:DATE, value:parseInt(weight)});
	LOGGED_WEIGHT = true;
	render_weight_record();
	unsave_data();
}

function delete_top_weight() {
	DATA.weight.pop();
	LOGGED_WEIGHT = false;
	render_weight_record();
	unsave_data();
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function render_edit_split() {
	let s = "";
	for(let day = 0; day < 7; day++) {
		s += `<div class=split_day>${DAY_NAMES[day]}:`;
		for(const entry of DATA.split[day]) {
			s += `<div class=split_item>${entry}<div class=split_item_remove onclick="split_remove(${day}, '${entry}')">REMOVE</div></div>`;
		}
		s += `<div class=split_add onclick="split_add(${day})">ADD</div></div>`;
	}
	document.getElementById("edit_split").innerHTML = s;
}

function split_add(day) {
	let entry = prompt(`Enter the exercise do you want to add to ${DAY_NAMES[day]}?`);
	if (!entry || entry.length < 1) return;
	DATA.split[day].push(entry);
	unsave_data();
	render_edit_split();
}

function split_remove(day, entry) {
	if (!confirm(`Are you sure you want to remove ${entry}?`)) return;
	
	let entries = DATA.split[day];
	
	const index = entries.indexOf(entry);

	if (index > -1) { 
	  entries.splice(index, 1);
	}
	
	unsave_data();
	render_edit_split();
}

function render_view_history() {
	let s = "";
	for (const session of DATA.history) {
		s += session.date + ":<ul>";
		for (const exercise of session.workouts) {
			s += '<li>' + exercise.name + '<br>';
			for (const set of exercise.sets) {
				s += `W: ${set.weight} | R: ${set.reps}<br>`;
			}
			s += '</li>';
		}
		s += "</ul>";
	}
	document.getElementById("view_history").innerHTML = s;
}

function select_exercise(exercise) {
	EXERCISE = exercise;
	SET_COUNT = 0;
	KEYPAD_VALUE = 0;
	KEYPAD_STATE = 0;
	select_menu("log_exercise");
	render_log_exercise();
}

function select_menu(menu_name) {
	let menus = document.body.getElementsByClassName("menu");
	for(const menu of menus)
		menu.style.display = "none";
	document.getElementById(menu_name).style.display = "block";
	
	render_log_exercise();
	render_weight_record();
	render_edit_split();
	render_select_exercise();
	render_view_history();
}

function setUserCredentials(credentials) {
	if (!credentials) select_menu('invalid_login');
	
    const [binId, apiKey] = credentials.split(":");

    if (!binId || !apiKey) select_menu('invalid_login');

    BIN_ID = binId;
    API_KEY = apiKey;
}

async function getUserData() {
	const response = await fetch(
		`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
		{
			method: "GET",
			headers: {
				"X-Master-Key": API_KEY
			}
		}
	);

	const result = await response.json();

	DATA = result.record;
	
	if (!DATA.requests) DATA.requests = 0;
	DATA.requests += 1;
	save_data();
}

async function save_data() {
	DATA.requests += 1;
	
	const response = await fetch(
		`https://api.jsonbin.io/v3/b/${BIN_ID}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"X-Master-Key": API_KEY
			},
			body: JSON.stringify(DATA)
		}
	);

	const result = await response.json();
	
	if (response.status == 200) {
		alert("Data saved");
		UNSAVED = false;
	} else {
		alert("Data not saved");
		DATA.requests -= 1;
	}
	
	if (DATA.requests > 9000) {
		alert("Less than 1000 requests remaining. Please create a new JSONBin account!");
	}
	console.log(`You have used ${DATA.requests}/10000 requests.`);

	document.getElementById("save_button").style.display = "none";
}

// BIN_ID:API_KEY
const BIN_KEY = prompt("Please enter your unique ID:");

window.onload = async () => {
	let s = '';
	for(let i = 1; i < 21; i++) {
		s += `<div class=reps_button onclick="keypad_set_reps(${i})">${i.toString().padStart(2, "0")}</div>`;
		if (i%4 == 0)
			s += '<br>';
	}
	document.getElementById("reps_keypad").innerHTML = s;
	
	setUserCredentials(BIN_KEY);
	
	await getUserData();
	
	document.getElementById("log_countdown").style.display = "none";
	
	select_menu('main_menu');
}

window.addEventListener("beforeunload", function (event) {
    if (!UNSAVED || confirm("Are you sure you want to exit without saving?")) return;

    event.preventDefault();
    event.returnValue = "";
});