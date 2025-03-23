module.exports = (io) => {
    let cameraSocket = null;
    // Replace single monitor socket with a Set to track multiple viewers
    const monitorSockets = new Set();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register', (type) => {
            if (type === 'camera') {
                console.log('Camera registered:', socket.id);
                cameraSocket = socket;
                // Notify all monitors that camera is connected
                if (monitorSockets.size > 0) {
                    socket.emit('monitor-connected');
                }
            } else if (type === 'monitor') {
                console.log('Monitor registered:', socket.id);
                monitorSockets.add(socket);
                // If camera is already connected, notify the new monitor
                if (cameraSocket) {
                    cameraSocket.emit('monitor-connected');
                }
            }
        });

        socket.on('monitor-connected', () => {
            if (cameraSocket) {
                cameraSocket.emit('monitor-connected');
            }
        });

        socket.on('offer', (offer) => {
            // Only forward offer to the specific monitor that just connected
            // This is part of the WebRTC signaling process
            if (monitorSockets.size > 0) {
                // The offer should be sent to all monitors that don't have a connection yet
                monitorSockets.forEach(monitorSocket => {
                    // We'll rely on the client-side logic to handle duplicate offers
                    monitorSocket.emit('offer', offer);
                });
            }
        });

        socket.on('answer', (answer) => {
            if (cameraSocket) {
                cameraSocket.emit('answer', answer);
            }
        });

        socket.on('ice-candidate', (candidate) => {
            if (!cameraSocket && monitorSockets.size === 0) return;

            if (cameraSocket && socket.id === cameraSocket.id) {
                // Send camera's ICE candidates to all monitors
                monitorSockets.forEach(monitorSocket => {
                    monitorSocket.emit('ice-candidate', candidate);
                });
            } else {
                // If this is a monitor sending an ICE candidate, forward it to the camera
                if (cameraSocket) {
                    cameraSocket.emit('ice-candidate', candidate);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (cameraSocket && socket.id === cameraSocket.id) {
                console.log('Camera disconnected');
                cameraSocket = null;
                // Notify all monitors that camera disconnected
                monitorSockets.forEach(monitorSocket => {
                    monitorSocket.emit('camera-disconnected');
                });
            }
            
            // Remove the socket from monitorSockets if it exists there
            monitorSockets.delete(socket);
        });
    });
};
