import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { AdminUser } from '../services/admin/admin-registration.service';

export interface ResponsableFormValue {
  prenom: string;
  nom: string;
  email: string;
  fonction: string;
  numTel: string;
  structure: string;
  linkedInLink: string;
}

/** Add / edit a room manager (responsable de salle) of the admin's establishment. */
@Component({
  selector: 'app-responsable-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatIcon, MatInput],
  template: `
    <h2 mat-dialog-title>{{ editing ? 'Modifier le responsable' : 'Ajouter un responsable de salle' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        @if (!editing) {
          <p class="info"><mat-icon aria-hidden="true">info</mat-icon>
            Le compte sera rattaché à votre établissement ; ses identifiants de connexion lui seront envoyés par e-mail.</p>
        }
        <div class="form-grid">
          <mat-form-field>
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="prenom" autocomplete="given-name" />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Nom</mat-label>
            <input matInput formControlName="nom" autocomplete="family-name" />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field class="full">
            <mat-label>E-mail</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            @if (form.controls.email.hasError('required')) { <mat-error>Ce champ est requis</mat-error> }
            @else { <mat-error>Veuillez entrer un e-mail valide</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Fonction</mat-label>
            <input matInput formControlName="fonction" />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Téléphone</mat-label>
            <input matInput type="tel" formControlName="numTel" autocomplete="tel" />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Structure</mat-label>
            <input matInput formControlName="structure" placeholder="Département, service…" />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Profil LinkedIn (facultatif)</mat-label>
            <input matInput type="url" formControlName="linkedInLink" placeholder="https://www.linkedin.com/in/…" />
            <mat-error>L'adresse doit commencer par http:// ou https://</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit">{{ editing ? 'Enregistrer' : 'Créer le compte' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    h2[mat-dialog-title] { font-size: var(--text-lg); font-weight: 650; }
    .info { display: flex; gap: var(--space-2); margin: 0 0 var(--space-3); padding: var(--space-3);
      border-radius: var(--radius-md); background: var(--color-info-soft); color: var(--color-text); font-size: var(--text-sm); }
    .info mat-icon { color: var(--color-info); flex: none; }
  `,
})
export class ResponsableFormDialogComponent {
  readonly data = inject<{ responsable?: AdminUser }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ResponsableFormDialogComponent, ResponsableFormValue>);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly editing = !!this.data.responsable?.id;
  private readonly r = this.data.responsable;

  readonly form = this.fb.group({
    prenom: [this.r?.prenom ?? '', Validators.required],
    nom: [this.r?.nom ?? '', Validators.required],
    email: [this.r?.email ?? '', [Validators.required, Validators.email]],
    fonction: [this.r?.fonction ?? '', Validators.required],
    numTel: [this.r?.numTel ?? '', Validators.required],
    structure: [this.r?.structure ?? '', Validators.required],
    linkedInLink: [this.r?.linkedInLink ?? '', Validators.pattern(/^\s*$|^https?:\/\/\S+$/i)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ref.close({
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      email: v.email.trim(),
      fonction: v.fonction.trim(),
      numTel: v.numTel.trim(),
      structure: v.structure.trim(),
      linkedInLink: v.linkedInLink.trim(),
    });
  }
}
