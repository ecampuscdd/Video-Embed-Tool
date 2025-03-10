//These elements were created in the html file. now they are placed into these variables
let myForm = document.getElementById('mainForm');
let textArea = document.getElementById('embedCode');
let videoLink = document.getElementById('videoLink');
let radioInfo = document.getElementsByName('transcriptAvailable');
let transcriptLink = document.getElementById('transcriptLink');
//These variable are created nationally(?) for use in this file. 
let videoID = '';
let videoTimeEmbed = '';
let videoTimeLink = '';
let radioValue = '';
//variable to get to the YouTube API - still need the API Key. This key has been removed from the code and placed into a config file.
let URL = 'https://www.googleapis.com/youtube/v3/videos';
	//Function to wait for submit from the HTML
	mainForm.onsubmit = function () {
	  try {
		let idMatch = getIDFromLink(videoLink.value);	//Get the video ID from the link.
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
		console.log(window.CONFIG);
		getEmbedCode(videoID);	//After all the checks to make sure the link has an ID go to the embed code.
	  } catch (error) {
		showError(error.message,"On Submit");
	  }
	  return false;
	};
	//Get the ID from the link
	function getIDFromLink(link) {
	  try {
		let linkPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:.*t=([0-9]+))?/;
		return linkPattern.exec(link);
	  } catch (error) {
		showError(error.message,"getIDFromLink");
		return null;
	  }
	}
	//Function to change the time to a format more common.
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
	//Function to change the date to a more common format
	function formatDate(isoDate) {
		const date = new Date(isoDate);
		const options = {
		  month: 'long', // Use full month names (e.g., January)
		  day: 'numeric',
		  year: 'numeric'
		};
		return date.toLocaleDateString('en-US', options); // Adjust locale if needed
	}
// Using the ID load the API key and get the YouTube information and format it into an output that can be embedded into canvas
async function getEmbedCode(id) {
	let params; // Declare params outside the try-catch block
	try {
        const apiKey = window.CONFIG.YOUTUBE_API_KEY; // Access the API key from config.js (hidden in the gitignore)
        if (!apiKey) throw new Error("API key not found in configuration.");
		//put together the params element
        params = new URLSearchParams({
            part: 'snippet,contentDetails',
            key: apiKey,
            id: id,
        });
    }catch(error){
		showError(error.message,"API Config");
		return; // Exit the function if API key retrieval fails
	}
	console.log("getEmbedCode Function");
    try {
        const response = await fetch(`${URL}?${params}`);	//Put together the url API call with the API Key and the YouTube ID
		if (!response.ok) throw new Error(`API Request Failed: ${response.statusText}`);

		const data = await response.json();	//With the responce, place that data into a json element called data
		if (data.items.length === 0) throw new Error("No video found with the provided ID.");

		console.log("API Response:", data);
		//Format all the parts into elements for later
		let title = data.items[0].snippet.title;	//Get the YouTube video title
		let duration = changeTimeFormat(data.items[0].contentDetails.duration);	//Get the duration formated in the approved way
		let uploadDate = formatDate(data.items[0].snippet.publishedAt); // Get upload date and format it to en-US standard
		let channelTitle = data.items[0].snippet.channelTitle; // Get channel title
		//Initiate the transcriptOption
		let transcriptOption = '';
		console.log(transcriptLink.value);
		//Run through the radio options and figure out which one is selected.
		for (i = 0; i < radioInfo.length; i++) {
			if (radioInfo[i].checked) radioValue = radioInfo[i].value;
		}
		//Once the radioValue is known, figure out what should be in the transcriptOption
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
		let embedCode = `<h3>Video: "${title}"</h3><p>
			<iframe name="videoIframe" id="videoPlayeriFrame" width="560" height="315" src="https://www.youtube.com/embed/${videoID}${videoTimeEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
			</p><p>If the video doesn't appear, follow this direct link: <a class="inline_disabled" href="https://youtu.be/${videoID}${videoTimeLink}" target="_blank" rel="noopener">${title}</a> (${duration})</p>${transcriptOption}<p>Video uploaded: ${uploadDate} by ${channelTitle}.</p>`;
			textArea.value = embedCode;
			$( "div.preview" ).html (`<hr>`+embedCode );
	} catch (error) {
		showError(error.message,"Video Details");
	}
}
// Show Errors in UI
function showError(errorMessage, place) {
    console.error("Error from ["+place+"]:", errorMessage);
    document.getElementById("previewWindow").innerHTML = `<h2 style="color: red;">Error from [${place}]:</h2><pre>${errorMessage}</pre>`;
}
