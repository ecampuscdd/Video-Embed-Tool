let myForm = document.getElementById('mainForm');
let textArea = document.getElementById('embedCode');
let videoLink = document.getElementById('videoLink');
let radioInfo = document.getElementsByName('transcriptAvailable');
let transcriptLink = document.getElementById('transcriptLink');

let videoID = '';
let videoTimeEmbed = '';
let videoTimeLink = '';
let radioValue = '';

let key = 'AIzaSyDoZv3STqommSilzzIHDPcPRjv34cHXb_Q';
let URL = 'https://www.googleapis.com/youtube/v3/videos';

mainForm.onsubmit = function () {
  try {
    let idMatch = getIDFromLink(videoLink.value);
    if (!idMatch) throw new Error("Invalid YouTube link.");
    videoID = idMatch[1];
    console.log("Extracted Video ID:", videoID);

    if (idMatch[2]) {
      videoTimeEmbed = `?start=${idMatch[2]}`;
      videoTimeLink = `?t=${idMatch[2]}`;
    } else {
      videoTimeEmbed = '';
      videoTimeLink = '';
    }
    getEmbedCode(videoID);
  } catch (e) {
    console.error("Error:", e.message);
    $("div.preview").html(`<p>${e.message}</p>`);
    textArea.value = e.message;
  }
  return false;
};

function getIDFromLink(link) {
  try {
    let linkPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:.*t=([0-9]+))?/;
    return linkPattern.exec(link);
  } catch (e) {
    console.error("Error in getIDFromLink:", e.message);
    return null;
  }
}

  function changeTimeFormat(isoDuration) {
    let [_, hours, minutes, seconds] = /PT(\d{1,2}H)?(\d{1,2}M)?(\d{1,2}S)?/.exec(isoDuration);
    function changeUnit(unit) {
      if (unit) {
        unit = unit.slice(0, -1);
        if (unit.length == 1) unit = unit.padStart(2, '0');
      }
      else unit = '00';
      return unit;
    }
    hours = changeUnit(hours);
    minutes = changeUnit(minutes);
    seconds = changeUnit(seconds);
    if (hours != '00') {
      return `${hours}:${minutes}:${seconds} hrs.`;
    }
    else {
      return `${minutes}:${seconds} min.`;
    }
  }
  function formatDate(isoDate) {
    const date = new Date(isoDate);
    const options = {
      month: 'long', // Use full month names (e.g., January)
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options); // Adjust locale if needed
  }

async function getEmbedCode(id) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    key: key,
    id: id,
  });
  	console.log("getEmbedCode Function");
  try {
    const response = await fetch(`${URL}?${params}`);
    if (!response.ok) throw new Error(`API Request Failed: ${response.statusText}`);

    const data = await response.json();
    if (data.items.length === 0) throw new Error("No video found with the provided ID.");

    console.log("API Response:", data);
	   
		let title = data.items[0].snippet.title;
		let duration = changeTimeFormat(data.items[0].contentDetails.duration);
		let uploadDate = formatDate(data.items[0].snippet.publishedAt); // Get upload date and format it to en-US standard
		let channelTitle = data.items[0].snippet.channelTitle; // Get channel title

		let transcriptOption = '';
		console.log(transcriptLink.value);
		for (i = 0; i < radioInfo.length; i++) {
			if (radioInfo[i].checked){
				radioValue = radioInfo[i].value;
			}
		}

	  if(radioValue == "hasCaptions"){
		transcriptOption = `</p>Use the direct link to open the video in YouTube to expand the video and display the video captions.</p>`;
	  }else if(radioValue == "HaveLink"){
		transcriptOption = `<p>Use the direct link to open the video in YouTube to display and expand the video. For a transcript, refer to the <a class="inline_disabled" href="${transcriptLink.value}" target="_blank" rel="noopener">${title} document</a>. </p>`;
	  }else if(radioValue == "Ordered"){
		transcriptOption = `<p>Use the direct link to open the video in YouTube to display and expand the video. For a transcript, refer to the ${title} document. </p>`;
	  }else if(radioValue == "No"){
		transcriptOption = `<p>Use the direct link to open the video in YouTube to display and expand the video.</p>
		<p><strong>Note:</strong> Please contact your instructor if you require a detailed transcript of audio/video content.</p>`;
	  }
      // Use the retrieved data to create the embed code 
      let embedCode = `<h3>Video: "${title}"</h3><p><iframe name="videoIframe" width="560" height="315" src="https://www.youtube.com/embed/${videoID}${videoTimeEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></p><p>If the video doesn't appear, follow this direct link: <a class="inline_disabled" href="https://youtu.be/${videoID}${videoTimeLink}" target="_blank" rel="noopener">${title}</a> (${duration})</p>${transcriptOption}<p>Video uploaded: ${uploadDate} by ${channelTitle}.</p>`;
      textArea.value = embedCode;
      $( "div.preview" ).html (`<hr>`+embedCode );
} catch (error) {
    console.error("Error fetching video details:", error.message);
    $("div.preview").html(`<p>${error.message}</p>`);
    textArea.value = error.message;
  }
  }
