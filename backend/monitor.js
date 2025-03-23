document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const remoteVideo = document.getElementById('remoteVideo');
    const startPlaybackButton = document.getElementById('startPlayback');
    let peerConnection;
    let isStreamSet = false;

    
    const videoWidth = 640; 
    const videoHeight = 480; 
    remoteVideo.width = videoWidth;
    remoteVideo.height = videoHeight;

    
    const maintainAspectRatio = () => {
        const aspectRatio = videoWidth / videoHeight;
        const containerWidth = remoteVideo.clientWidth;
        const calculatedHeight = containerWidth / aspectRatio;

        remoteVideo.style.width = '100%'; 
        remoteVideo.style.height = `${calculatedHeight}px`;
    };

    
    window.addEventListener('resize', maintainAspectRatio);

    if (startPlaybackButton) {
        startPlaybackButton.addEventListener('click', () => {
            remoteVideo.style.display = 'block';
            startPlaybackButton.style.display = 'none';
            if (remoteVideo.srcObject) {
                remoteVideo.play().catch(error => console.error('Error playing video:', error));
            }
            maintainAspectRatio(); 
        });
    } else {
        console.error('startPlaybackButton not found in DOM');
    }

    socket.emit('register', 'monitor');
    socket.emit('monitor-connected');

    socket.on('offer', async (offer) => {
        console.log("Received Offer (Monitor):", offer);

        try {
            peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            console.log("PeerConnection created");

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    console.log("Sending ICE candidate (Monitor):", event.candidate);
                    socket.emit('ice-candidate', event.candidate);
                } else {
                    console.log("ICE gathering complete (Monitor)");
                }
            };

            peerConnection.onconnectionstatechange = e => {
                console.log("Peer connection state change (Monitor)", peerConnection.connectionState);
            };

            peerConnection.onicegatheringstatechange = e => {
                console.log("ICE gathering state changed (Monitor):", peerConnection.iceGatheringState);
            };

            peerConnection.addEventListener('track', async event => {
                console.log("ontrack event received (Monitor):", event);
                if (event && event.streams && event.streams[0]) {
                    console.log("Remote stream:", event.streams[0]);
                    try {
                        if (!isStreamSet) {
                            remoteVideo.srcObject = event.streams[0];
                            isStreamSet = true;
                            console.log("Stream set to remoteVideo");

                            // Maintain aspect ratio after setting the stream
                            maintainAspectRatio();
                        }
                    } catch (error) {
                        console.error("Error setting remote video stream:", error);
                    }
                } else {
                    console.error("Invalid stream received in ontrack event:", event);
                }
            });

            try {
                const remoteDesc = new RTCSessionDescription(offer);
                console.log("Remote Description Created (Monitor):", remoteDesc);
                await peerConnection.setRemoteDescription(remoteDesc);
                console.log("setRemoteDescription successful (Monitor)");
            } catch (error) {
                console.error("Error in setRemoteDescription (Monitor):", error);
                return;
            }

            try {
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', answer);
            } catch (error) {
                console.error("Error in createAnswer (Monitor):", error);
                return;
            }

        } catch (error) {
            console.error("Error handling offer:", error);
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
        }
    });

    socket.on('ice-candidate', candidate => {
        console.log("Received ICE candidate (Monitor):", candidate);
        if (peerConnection && candidate) {
            try {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        }
    });
});




















