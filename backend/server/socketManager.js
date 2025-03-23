module.exports = (io) => {
    let cameraSocket = null;
    let monitorSocket = null;

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register', (type) => {
            if (type === 'camera') {
                console.log('Camera registered:', socket.id);
                cameraSocket = socket;
                if (monitorSocket) {
                    cameraSocket.emit('monitor-connected');
                }
            } else if (type === 'monitor') {
                console.log('Monitor registered:', socket.id);
                monitorSocket = socket;
                if (cameraSocket) {
                    cameraSocket.emit('monitor-connected');
                }
            }
        });

        socket.on('offer', (offer) => {
            if (monitorSocket) {
                monitorSocket.emit('offer', offer);
            }
        });

        socket.on('answer', (answer) => {
            if (cameraSocket) {
                cameraSocket.emit('answer', answer);
            }
        });

        socket.on('ice-candidate', (candidate) => {
            if (!cameraSocket || !monitorSocket) return;

            if (socket.id === cameraSocket.id) {
                monitorSocket.emit('ice-candidate', candidate);
            } else if (socket.id === monitorSocket.id) {
                cameraSocket.emit('ice-candidate', candidate);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (socket.id === cameraSocket?.id) {
                console.log('Camera disconnected');
                cameraSocket = null;
            }
            if (socket.id === monitorSocket?.id) {
                console.log('Monitor disconnected');
                monitorSocket = null;
            }
        });
    });
};


















