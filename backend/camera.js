const socket = io();
let peerConnection;
let localStream;

socket.emit('register', 'camera');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        console.log("Local Stream (Camera):", localStream);
        
        // Display the local stream in a video element (optional)
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        socket.on('monitor-connected', async () => {
            console.log("Monitor connected, creating offer");

            try {
                // We create a new RTCPeerConnection for each monitor connection request
                // This ensures we're in a clean state for signaling
                if (peerConnection) {
                    peerConnection.close();
                }
                
                peerConnection = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                });

                // Add all local tracks to the peer connection
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        console.log("Sending ICE candidate (Camera):", event.candidate);
                        socket.emit('ice-candidate', event.candidate);
                    } else {
                        console.log("ICE gathering complete (Camera)");
                    }
                };

                peerConnection.onconnectionstatechange = () => {
                    console.log("Peer connection state change (Camera):", peerConnection.connectionState);
                };

                // Handle negotiation needed
                peerConnection.onnegotiationneeded = async () => {
                    try {
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.emit('offer', offer);
                    } catch (error) {
                        console.error("Error during negotiation (Camera):", error);
                    }
                };

            } catch (error) {
                console.error("Error creating peer connection (Camera):", error);
            }
        });

        socket.on('answer', async answer => {
            console.log("Received Answer (Camera):", answer);
            try {
                if (peerConnection) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (error) {
                console.error("Error setting remote description (Camera):", error);
            }
        });

        socket.on('ice-candidate', candidate => {
            console.log("Received ICE candidate (Camera):", candidate);
            if (peerConnection && candidate) {
                try {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error("Error adding ICE candidate (Camera):", error);
                }
            }
        });
    })
    .catch(error => console.error('getUserMedia error (Camera):', error));

// Handle page unload to clean up resources
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection) {
        peerConnection.close();
    }
});
