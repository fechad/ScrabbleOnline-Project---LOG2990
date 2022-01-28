import { Injectable } from '@angular/core';

// TODO : Avoir un fichier séparé pour les constantes et ne pas les répéter!

@Injectable({
    providedIn: 'root',
})
export class SkipTurn {
    isYourTurn = true;
    skipTurn() {
        this.isYourTurn = !this.isYourTurn;
    }
}
