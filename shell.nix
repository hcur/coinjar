{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    nodejs
    go
    sqlite-web
    tmux
  ];

  shellHook = ''
    # Function to cleanup tmux session on exit
    cleanup() {
      if tmux has-session -t dev 2>/dev/null; then
        tmux kill-session -t dev
      fi
    }

    trap cleanup exit

    # Check if we're already in a tmux session to avoid nested sessions
    if [ -z "$TMUX" ]; then
      # Kill existing dev session if it exists
      tmux kill-session -t dev 2>/dev/null || true

      # Create a new tmux session named 'dev' (detached)
      tmux new-session -d -s dev

      # Split the window vertically (creates two panes)
      tmux split-window -v -t dev

      # Send commands to each pane
      # Pane 0 (left): First initialization command
      tmux send-keys -t dev 'echo "Starting backend..." && go run .' Enter

      # Pane 1 (right): Second initialization command
      tmux send-keys -t dev 'echo "Starting frontend..." && cd web && npm run dev' Enter

      # Attach to the session
      tmux attach-session -t dev
    else
      echo "Already in tmux session. Run commands manually"
    fi
  '';
}
