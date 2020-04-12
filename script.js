const YOUTUBE_CLICK_DELAY = 2;
const REFRESH_INFOS_SECONDS = 5;
const REFRESH_COUNTDOWN_SECONDS = 0.5;
const COUNTDOWN_BEFORE_SECONDS = 300;

window.addEventListener("load", async () => {
	const dateString = (await fetch("/")).headers.get("Date");
	const officialTime = new Date(dateString);
  const diffOfficial = moment().diff(officialTime, "seconds");
	console.info("Time difference", diffOfficial, "seconds");

	let infos = {};
	async function reload() {
	   infos = await (await fetch("infos.json")).json();
	};
  setInterval(reload, REFRESH_INFOS_SECONDS * 1000);

	async function refresh() {
    const { videos = [], conf } = infos;

    const tpl = document.getElementById("video-tpl");
    const root = document.getElementById("videos");
    root.innerHTML = "";

    const currentTime = moment().add(diffOfficial, "seconds");

    for (const video of videos) {
      video.datetime = new Date(video.start);     
      video.elapsed = currentTime.diff(video.datetime, "seconds");
    }

    let first = 0;
    for (let i = videos.length - 1; i >= 0; i--) {
      if (videos[i].elapsed > 0) {
        first = i;
        break;
      }
    }

  	videos.slice(first).forEach(video => {
      const elt = tpl.content.cloneNode(true);

      const started = video.elapsed > 0;
      const since = Math.max(video.elapsed + YOUTUBE_CLICK_DELAY, 0);
      const ytUrl = `https://www.youtube.com/watch?v=${video.youtube}&t=${since}s`;

      elt.querySelector("h1").textContent = video.title;
      const when = moment(video.datetime).format("HH:mm on ddd D MMMM");
      elt.querySelector(".when").textContent = `Start${started ? "ed on" : "s at"} ${when} `;
      elt.querySelector("a.yt").textContent = ytUrl;
      elt.querySelector("a.yt").href = ytUrl;
      elt.querySelector("img.yt").src = `https://img.youtube.com/vi/${video.youtube}/hqdefault.jpg`;

      let elapsed;
      if (video.elapsed > -COUNTDOWN_BEFORE_SECONDS) {
        const abs = Math.abs(video.elapsed);
        const hours = Math.floor(abs / 3600);
        const minutes = Math.floor((abs % 3600) / 60);
        const seconds = abs % 60;
        elapsed = `
          ${video.elapsed < 0 ? "-" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}
        `;
      }
      else {
        elapsed = `Press play ${currentTime.to(video.datetime)}`; 
      }
      elt.querySelector(".elapsed").textContent = `▶ ${elapsed}`;

      root.appendChild(elt);
    });

    document.getElementById("conf").textContent = conf;
    document.getElementById("conf").href = conf;
  }
  setInterval(refresh, REFRESH_COUNTDOWN_SECONDS * 1000);
  
  await reload();
  await refresh();
});
