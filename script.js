const YOUTUBE_CLICK_DELAY = 2;
const REFRESH_INFOS_SECONDS = 5;
const REFRESH_COUNTDOWN_SECONDS = 0.5;
const COUNTDOWN_BEFORE_SECONDS = 300;

window.addEventListener("load", async () => {
  const dateString = (await fetch("/")).headers.get("Date");
  const officialTime = new Date(dateString);
  const diffOfficial = moment().diff(officialTime, "seconds");
  console.info("Time difference", diffOfficial, "seconds");

  let allVideos = [];
  async function reload() {
    const infos = await (await fetch("infos.json")).json();
    allVideos = infos.videos.map(video => {
      const start = new Date(video.start);
      return  {
        start,
        end: moment(start).add(video.duration, "seconds").toDate(),
        ...video
      }
    });

    const videoconf = document.getElementById("videoconf");
    videoconf.textContent = infos.videoconf;
    videoconf.href = infos.videoconf;
  };
  setInterval(reload, REFRESH_INFOS_SECONDS * 1000);

  const tpl = document.getElementById("video-tpl");
  const rootPrev = document.getElementById("videos-prev");
  const rootCurrent = document.getElementById("videos-current");
  const rootNext = document.getElementById("videos-next");

  let lastVideo;

  async function refresh() {
    const currentTime = moment().add(diffOfficial, "seconds");

    rootPrev.innerHTML = "";
    rootNext.innerHTML = "";

    allVideos.forEach(video => {
      const remaining = moment(video.end).diff(currentTime, "seconds");
      const elapsed = currentTime.diff(video.start, "seconds");

      let elt;
      if (elapsed > 0 && remaining > 0) {
        if (lastVideo != video.youtube) {
          elt = tpl.content.cloneNode(true);
          rootCurrent.innerHTML = "";
          rootCurrent.appendChild(elt);

          lastVideo = video.youtube;
        }
        elt = rootCurrent.children[0];
      } else {
        elt = tpl.content.cloneNode(true);
      }

      elt.querySelector("h1").textContent = video.title;
      elt.querySelector("img.yt").src = `https://img.youtube.com/vi/${video.youtube}/hqdefault.jpg`;

      const when = moment(video.start).format("HH:mm on ddd D MMMM");
      elt.querySelector(".when").textContent = `Start${elapsed > 0 ? "ed" : "s"} at ${when} `;

      let countdown = "";
      let since = "";
      if (remaining > 0) {
        if (elapsed > -COUNTDOWN_BEFORE_SECONDS) {
          const abs = Math.abs(elapsed);
          const hh = Math.floor(abs / 3600);
          const mm = Math.floor((abs % 3600) / 60);
          const ss = abs % 60;
          countdown = `▶ ${elapsed < 0 ? "-" : ""}${hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}`;

          const t = Math.max(elapsed + YOUTUBE_CLICK_DELAY, 0);
          since = `&t=${t}s`;
        }
        else {
          countdown = `▶ ${currentTime.to(video.start)}`;
        }
      } else {
        countdown = `Ended ${currentTime.to(video.end)}`;
      }
      elt.querySelector(".countdown").textContent = countdown;

      const ytUrl = `https://www.youtube.com/watch?v=${video.youtube}${since}`;
      elt.querySelector("a.yt").textContent = ytUrl;
      elt.querySelector("a.yt").href = ytUrl;

      if (remaining < 0) {
        rootPrev.insertBefore(elt, rootPrev.firstChild);
      } else if (elapsed < 0) {
        rootNext.appendChild(elt);
      }
    });
  }
  setInterval(refresh, REFRESH_COUNTDOWN_SECONDS * 1000);
  
  await reload();
  await refresh();
});
