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
        id: video.hosted ? video.hosted.url : video.youtube,
        thumbnail: video.hosted ? video.hosted.thumbnail : `https://img.youtube.com/vi/${video.youtube}/hqdefault.jpg`,
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
  const rootCurrent = document.getElementById("infos-current");
  const rootNext = document.getElementById("videos-next");

  let lastVideo;
  let player;

  async function refresh() {
    const currentTime = moment().add(diffOfficial, "seconds");

    rootPrev.innerHTML = "";
    rootCurrent.innerHTML = "";
    rootNext.innerHTML = "";

    let currentVideo;

    allVideos.forEach(video => {
      const remaining = moment(video.end).diff(currentTime, "seconds");
      const elapsed = currentTime.diff(video.start, "seconds");

      if (elapsed > 0 && remaining > 0) {
        currentVideo = video;
        if (!player) {
          player = new Plyr("#player");
        }
        if (video.id != lastVideo) {
          // Current video changed! Load it!
          player.source = video.hosted ?
            { type: video.hosted.type, sources: [ { src: video.hosted.url, type: video.hosted.format } ]} :
            { type: "video", sources: [{ src: video.youtube, provider: "youtube" }]};

          lastVideo = video.id;
        }
        if (Math.abs(player.currentTime - elapsed) > YOUTUBE_CLICK_DELAY) {
          player.currentTime = elapsed;
        }
      }

      const elt = tpl.content.cloneNode(true);
      elt.querySelector("h1").textContent = video.title;
      elt.querySelector(".description").textContent = video.description;

      const when = moment(video.start).format("HH:mm on ddd D MMMM");
      const duration = moment.duration(video.duration, "seconds").format("H [hour]");
      elt.querySelector(".when").textContent = `Start${elapsed > 0 ? "ed" : "s"} at ${when} (~${duration})`;

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

      let ytUrl;
      if (video.youtube) {
        ytUrl = `https://www.youtube.com/watch?v=${video.youtube}${since}`;
      } else {
        ytUrl = video.hosted.url;
      }
      elt.querySelector("img.yt").src = video.thumbnail;
      elt.querySelector("a.yt").textContent = ytUrl;
      elt.querySelector("a.yt").href = ytUrl;

      if (remaining < 0) {
        rootPrev.insertBefore(elt, rootPrev.firstChild);
      } else if (elapsed < 0) {
        rootNext.appendChild(elt);
      } else {
        rootCurrent.appendChild(elt);
      }
    });

    if (!currentVideo && player) {
      player.destroy();
      player = null;
      rootCurrent.innerHTML = "";
      lastVideo = null;
    }
  }
  setInterval(refresh, REFRESH_COUNTDOWN_SECONDS * 1000);
  
  await reload();
  await refresh();
});
