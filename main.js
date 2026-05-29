console.log("Main JS Loaded");


/* 🔥 SUPABASE */

const supabaseUrl =
"https://qldtsrlcjarlgowshere.supabase.co";

const supabaseKey =
"sb_publishable_VHJ2xACTYwziLbfQQoaDhg_xehncUdX";


const db =
window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);



/* 👤 ADMIN STATE */

let isAdmin = false;



/* 🕒 CLOCK */

function updateClock(){

  const now = new Date();

  let hours =
    now.getHours();

  const minutes =
    String(
      now.getMinutes()
    ).padStart(2,"0");

  const seconds =
    String(
      now.getSeconds()
    ).padStart(2,"0");


  let ampm = "AM";


  if(hours >= 12){

    ampm = "PM";
  }


  hours = hours % 12;

  if(hours === 0){

    hours = 12;
  }


  document
    .getElementById("clock")
    .innerText =
    `${hours}:${minutes}:${seconds} ${ampm}`;
}


setInterval(updateClock,1000);

updateClock();



/* 📄 SECTION SWITCH */

function showSection(id){

  document
    .querySelectorAll("section")
    .forEach(section => {

      section.classList.remove("active");

    });


  document
    .getElementById(id)
    .classList.add("active");
}



/* 🔐 LOGIN */

async function login(){

  const email =
    document
      .getElementById("email")
      .value;

  const password =
    document
      .getElementById("password")
      .value;


  const {
    error
  } = await db.auth.signInWithPassword({

    email,
    password

  });


  if(error){

    alert(error.message);

    return;
  }


  checkSession();
}



/* 🚪 LOGOUT */

async function logout(){

  await db.auth.signOut();

  checkSession();
}



/* 👤 SESSION */

async function checkSession(){

  const {
    data
  } = await db.auth.getSession();


  const session =
    data.session;


  if(session){

    isAdmin = true;


    document
      .getElementById("loginBox")
      .style.display = "none";


    document
      .getElementById("adminPanel")
      .style.display = "block";

  }else{

    isAdmin = false;


    document
      .getElementById("loginBox")
      .style.display = "block";


    document
      .getElementById("adminPanel")
      .style.display = "none";
  }


  loadNews();
}



/* 📰 ADD NEWS */

async function addNews(){

  const category =
    document
      .getElementById("category")
      .value;

  const title =
    document
      .getElementById("title")
      .value;

  const preview =
    document
      .getElementById("preview")
      .value;

  const content =
    document
      .getElementById("content")
      .value;
     const imageFile =
    document
    .getElementById("newsImage")
    .files[0];

  const breaking =
    category === "Breaking";

   let imageUrl = "";


if(imageFile){

  const fileName =
    `${Date.now()}-${imageFile.name}`;


  const {
    error: uploadError
  } = await db.storage
      .from("news-image")
      .upload(
        fileName,
        imageFile
      );


  if(uploadError){

    alert(uploadError.message);

    return;
  }


  const {
    data
  } = db.storage
      .from("news-images")
      .getPublicUrl(fileName);


  imageUrl =
    data.publicUrl;
}
  const {
    error
  } = await db
      .from("news")
      .insert([
        {
  category,
  title,
  preview,
  content,
  breaking,
  image_url:imageUrl
}
      ]);


  if(error){

    console.log(error);

    alert(error.message);

    return;
  }



  /* 🗃 ARCHIVE */

  await db
    .from("news_archive")
    .insert([
      {
        category,
        title,
        preview,
        content
      }
    ]);


  document
    .getElementById("title")
    .value = "";

  document
    .getElementById("preview")
    .value = "";

  document
    .getElementById("content")
    .value = "";


  loadNews();
}



/* 🗑 DELETE */

async function deleteNews(id){

  const confirmDelete =
    confirm(
      "Delete this article?"
    );


  if(!confirmDelete){

    return;
  }


  const {
    error
  } = await db
      .from("news")
      .delete()
      .eq("id", id);


  if(error){

    console.log(error);

    alert(error.message);

    return;
  }


  loadNews();
}

/* 🕒 TIME FORMAT */

function formatTimeAgo(dateString){

  const now =
    new Date();

  const created =
    new Date(dateString);

  const diffMs =
    now - created;

  const diffHours =
    Math.floor(
      diffMs / (1000 * 60 * 60)
    );

  const diffMinutes =
    Math.floor(
      diffMs / (1000 * 60)
    );


  let hours =
    created.getHours();

  const minutes =
    String(
      created.getMinutes()
    ).padStart(2,"0");


  let ampm = "AM";


  if(hours >= 12){

    ampm = "PM";
  }


  hours = hours % 12;

  if(hours === 0){

    hours = 12;
  }


  const formattedTime =
    `${hours}:${minutes}${ampm}`;


  if(diffMinutes < 60){

    return `${diffMinutes} min ago @ ${formattedTime}`;
  }


  if(diffHours < 24){

    return `${diffHours} hours ago @ ${formattedTime}`;
  }


  const diffDays =
    Math.floor(diffHours / 24);

  return `${diffDays} days ago @ ${formattedTime}`;
}

/* 📰 LOAD NEWS */

async function loadNews(){

  let featuredHTML = "";

  let html = "";

  const now = new Date();


  const {
    data,
    error
  } = await db
      .from("news")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false
        }
      );


  if(error){

    console.log(error);

    return;
  }


  data.forEach(news => {

    const created =
      new Date(news.created_at);

    const ageHours =
      (now - created) /
      (1000 * 60 * 60);



    /* ⏳ HIDE AFTER 72 HOURS */

    if(ageHours > 72){

      return;
    }



    /* 🚨 BREAKING */

    const isBreaking =
      news.breaking &&
      ageHours <= 8;



    let cardClass =
      (news.category || "General")
      .toLowerCase();



    if(isBreaking){

      cardClass = "breaking";
    }



    const card = `

      <div class="card ${cardClass}">
      ${news.image_url ? `

<img
  src="${news.image_url}"
  class="newsImage">

` : ""}

        <span class="category ${cardClass}">
          ${news.category || "General"}
        </span>

        <h2>

          <a href="article.html?id=${news.id}">

            ${news.title}

          </a>

        </h2>

        <p class="preview">

          ${news.preview || ""}

        </p>
        <p class="timeStamp">

  ${formatTimeAgo(news.created_at)}
         </p>
        ${isAdmin ? `

        <button
          class="deleteBtn"
          onclick="deleteNews(${news.id})">

          Delete

        </button>

        ` : ""}

      </div>

    `;



    if(isBreaking){

      featuredHTML += card;

    }else{

      html += card;
    }

  });



  document
    .getElementById("featuredNews")
    .innerHTML = featuredHTML;



  document
    .getElementById("newsBox")
    .innerHTML = html;
}



/* 🚀 START */

checkSession();

loadNews();