{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    go
    sqlite-web
    tmux
  ];

  shellHook = ''
    echo "Starting frontend..."
    go run .
  '';
}
