import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Button } from '@app/classes/button';
import { HighScoresComponent } from '@app/components/high-scores/high-scores.component';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    buttonsMainPage: Button[] = [
        {
            route: '/classic',
            toolTip: 'Une partie de Scrabble avec les règles classiques',
            text: 'Mode Classique',
            disabled: false,
            promptsDialog: false,
        },
        {
            route: '/log2990',
            toolTip: 'Ajoutez du piquant à votre partie\navec des objectifs supplémentaires',
            text: 'Mode LOG2990',
            disabled: false,
            promptsDialog: false,
        },
        { route: undefined, toolTip: 'Voyez qui règne', text: 'Meilleurs scores', disabled: false, promptsDialog: true },
    ];
    constructor(private readonly matDialog: MatDialog) {}

    openPopUp() {
        this.matDialog.open(HighScoresComponent);
    }
}
