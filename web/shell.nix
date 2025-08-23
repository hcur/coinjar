{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell {
  buildInputs = [
    nodejs
  ];

  shellHook = ''
    echo "Starting backend..."
    npm run dev
  '';
}
