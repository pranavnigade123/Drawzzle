socket.on('drawing', ({ lobbyCode, paths }) => {
  const game = getGameFromLobby(lobbyCode);
  if (game?.drawer?.socketId === socket.id) {
    socket.to(lobbyCode).emit('drawing-update', { paths });
  }
});
