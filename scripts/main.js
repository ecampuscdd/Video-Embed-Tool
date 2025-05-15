/**
	This is the main javascript file that is used to pull the YouTube information and format it into an embed string that can be placed into 
	a Canvas page. The page uses a YouTube URL to get started. The Get Embed Code button starts things off. Clicking it will start the 
	Google OAuth 2.0 process. This means that the script uses the users authority to get a token that is then used to pull the info needed.
	NOTE:
		*	Users use their Google credentials to authenticate. 
		*	This is a more secure way to code. 
		*	Errors can be submitted to Todd.
*/

let videoTimeEmbed = '';
let videoTimeLink = '';
const URL = 'https://www.googleapis.com/youtube/v3/videos';
let accessToken = ''; // Store the access token
let tokenExpiration = 0; // Store token expiration time

// --- Helper Functions ---
function getIDFromLink(docLink) {
    try {
        let linkPattern =
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:.*t=([0-9]+))?/;
        return linkPattern.exec(docLink);
    } catch (error) {
        showError(error.message, 'getIDFromLink');
        return null;
    }
}

function changeTimeFormat(isoDuration) {
    let [_, hours, minutes, seconds] = /PT(\d{1,2}H)?(\d{1,2}M)?(\d{1,2}S)?/.exec(isoDuration);
    function changeUnit(unit) {
        if (unit) {
            unit = unit.slice(0, -1);
            if (unit.length == 1)
                unit = unit.padStart(2, '0');
        } else unit = '00';
        return unit;
    }
    hours = changeUnit(hours);
    minutes = changeUnit(minutes);
    seconds = changeUnit(seconds);
    if (hours != '00') {
        return `${hours}:${minutes}:${seconds} hrs.`;
    } else {
        return `${minutes}:${seconds} min.`;
    }
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    const options = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
}

function showError(errorMessage, place) {
    console.error('Error from [' + place + ']:', errorMessage);
    document.getElementById('previewWindow').innerHTML =
        `<h2 style="color: red;">Error from [${place}]:</h2><pre>${errorMessage}</pre>`;
    textArea.value = errorMessage;
}

function getSelectedRadioValue() {
    const radioButtons = document.getElementsByName('transcriptAvailable');
    for (let i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            return radioButtons[i].value;
        }
    }
    return null; // Or a default value if none are checked
}

function handleCredentialResponse(response) {
    console.log('Initial Credential Response (ID Token):', response.credential);
}

//This checks if there is a token already in place if there is an active token program will continue
function handleAuthClick() {
	const currentTime = Date.now();	//Gets the current dateTime to reference in an ifElse statement
	if (accessToken && currentTime < tokenExpiration) {
		console.log("Reusing existing access token.");
		getEmbedCode(); // If token is still valid, proceed directly
	}else{
		try{
			google.accounts.oauth2.initTokenClient({
				client_id: '1017706166578-bq76ahpa7g648bs1a8j8pf3e3jt4900a.apps.googleusercontent.com',  // Use external config file
				scope: 'https://www.googleapis.com/auth/youtube.readonly',
				prompt: "consent",
				callback: (tokenResponse) => {
					accessToken = tokenResponse.access_token;
					tokenExpiration = Date.now() + (tokenResponse.expires_in * 1000); // Store expiration time

					// Start searching once authenticated
					getEmbedCode();
				},
			}).requestAccessToken();
		}catch(error){
			showError("Unexpected authentication error: " + error.message);
		}
	}
}

async function getEmbedCode() {
    let params, id;
	try{
		id = getIDFromLink(document.getElementById('videoLink').value);
		
		//check if id or accessToken is null or undefined
		if (!id) throw new Error("No URL provided.");
		if (!accessToken) throw new Error("Access token is missing.");
    
        params = new URLSearchParams({
            part: 'snippet,contentDetails',
            access_token: accessToken,
            id: id,
        });

        const response = await fetch(`${URL}?${params}`);
        if (!response.ok) throw new Error(`API Request Failed: ${response.statusText}`);

        const data = await response.json();
        if (data.items.length === 0) throw new Error('No video found with the provided ID.');

        //console.log('API Response:', data);

        let title = data.items[0].snippet.title;
        let duration = changeTimeFormat(data.items[0].contentDetails.duration);
        let uploadDate = formatDate(data.items[0].snippet.publishedAt);
        let channelTitle = data.items[0].snippet.channelTitle;
        let transcriptOption = '';
		let radioValue = getSelectedRadioValue();
		console.log("Selected Transcript Option:", radioValue);
		
        for (let i = 0; i < document.getElementsByName('transcriptAvailable').length; i++) {
            if (document.getElementsByName('transcriptAvailable')[i].checked) {
                radioValue = document.getElementsByName('transcriptAvailable')[i].value;
            }
        }

        if (radioValue == 'hasCaptions') {
            transcriptOption =
                '</p>Use the direct link to open the video in YouTube to expand the video and display the video captions.</p>';
        } else if (radioValue == 'HaveLink') {
            transcriptOption = `<p>Use the direct link to open the video in YouTube to display and expand the video. For a transcript, refer to the <a class="inline_disabled" href="${document.getElementById('transcriptLink').value}" target="_blank" rel="noopener">${title} document</a>. </p>`;
        } else if (radioValue == 'Ordered') {
            transcriptOption = `<p>Use the direct link to open the video in YouTube to display and expand the video. For a transcript, refer to the ${title} document. </p>`;
        } else if (radioValue == 'No') {
            transcriptOption =
                `<p>Use the direct link to open the video in YouTube to display and expand the video.</p>
            <p><strong>Note:</strong> Please contact your instructor if you require a detailed transcript of audio/video content.</p>`;
        }

        let embedCode = `<h3>Video: "${title}"</h3><p>
            <iframe name="videoIframe" id="videoPlayeriFrame" width="560" height="315" src="https://www.youtube.com/embed/$$${id}${videoTimeEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </p><p>If the video doesn't appear, follow this direct link: <a class="inline_disabled" href="https://youtu.be/$$${id}${videoTimeLink}" target="_blank" rel="noopener">${title}</a> (${duration})</p>${transcriptOption}<p>Video uploaded: ${uploadDate} by ${channelTitle}.</p>`;
        document.getElementById('embedCode').value = embedCode;
        $('div.preview').html(`<hr>` + embedCode);
    } catch (error) {
        showError(error.message);
    }
}
