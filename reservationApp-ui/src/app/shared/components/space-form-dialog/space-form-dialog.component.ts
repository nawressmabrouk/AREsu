import { Component, inject, Injectable, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { Espace } from '../../../models/espace.model';
import { categoryValue, COMMON_EQUIPMENTS, SPACE_CATEGORIES, typeLabel, typesOf } from '../../space-catalog';

export interface SpaceFormData {
  /** Space to edit; omit to create one. */
  espace?: Partial<Pick<Espace, 'id' | 'nom' | 'capacite' | 'categorie' | 'type' | 'equipement' | 'responsableId'>>;
  /** Shown as a required select when given (admin: choose the room manager). */
  responsables?: { id: string; label: string }[];
}

export interface SpaceFormValue {
  nom: string;
  capacite: number;
  categorie: string;
  type: string;
  equipement: string[];
  responsableId?: string;
}

/** Create / edit a space (room manager and admin pages). Open it with SpaceFormService. */
@Component({
  selector: 'app-space-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatCheckbox, MatFormFieldModule, MatIcon, MatInput, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ editing ? "Modifier l'espace" : 'Ajouter un espace' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="form-grid">
          @if (data.responsables) {
            <mat-form-field class="full">
              <mat-label>Responsable de l'espace</mat-label>
              <mat-select formControlName="responsableId">
                @for (r of data.responsables; track r.id) { <mat-option [value]="r.id">{{ r.label }}</mat-option> }
              </mat-select>
              @if (!data.responsables.length) { <mat-hint>Aucun responsable : ajoutez-en un d'abord.</mat-hint> }
              <mat-error>Choisissez un responsable</mat-error>
            </mat-form-field>
          }
          <mat-form-field>
            <mat-label>Nom de l'espace</mat-label>
            <input matInput formControlName="nom" cdkFocusInitial />
            <mat-error>Ce champ est requis</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Capacité</mat-label>
            <input matInput type="number" min="1" formControlName="capacite" />
            <span matTextSuffix>personnes</span>
            <mat-error>Indiquez une capacité d'au moins 1 personne</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Catégorie</mat-label>
            <mat-select formControlName="categorie" (selectionChange)="form.controls.type.setValue('')">
              @for (c of categories; track c.value) { <mat-option [value]="c.value">{{ c.label }}</mat-option> }
            </mat-select>
            <mat-error>Choisissez une catégorie</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Type</mat-label>
            <mat-select formControlName="type">
              @for (t of types(); track t) { <mat-option [value]="t">{{ typeLabel(t) }}</mat-option> }
            </mat-select>
            @if (!form.controls.categorie.value) { <mat-hint>Choisissez d'abord une catégorie</mat-hint> }
            <mat-error>Choisissez un type</mat-error>
          </mat-form-field>
        </div>

        <fieldset>
          <legend>Équipements disponibles</legend>
          <div class="equipments">
            @for (eq of equipmentOptions(); track eq) {
              <mat-checkbox [checked]="hasEquipment(eq)" (change)="toggleEquipment(eq)">{{ eq }}</mat-checkbox>
            }
          </div>
          <div class="add">
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Autre équipement</mat-label>
              <input matInput #custom (keydown.enter)="$event.preventDefault(); addEquipment(custom)" />
            </mat-form-field>
            <button mat-stroked-button type="button" (click)="addEquipment(custom)"><mat-icon>add</mat-icon>Ajouter</button>
          </div>
        </fieldset>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit">{{ editing ? 'Enregistrer' : "Ajouter l'espace" }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    h2[mat-dialog-title] { font-size: var(--text-lg); font-weight: 650; }
    .form-grid { margin-top: var(--space-1); }
    fieldset { margin: var(--space-3) 0 0; padding: 0; border: 0; }
    legend { margin-bottom: var(--space-2); font-weight: 600; font-size: var(--text-sm); }
    .equipments { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); margin-left: calc(-1 * var(--space-2)); }
    .add { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); }
    .add mat-form-field { flex: 1; margin-top: 0; }
  `,
})
export class SpaceFormDialogComponent {
  readonly data = inject<SpaceFormData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SpaceFormDialogComponent, SpaceFormValue>);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly editing = !!this.data.espace?.id;
  readonly categories = SPACE_CATEGORIES;
  readonly typeLabel = typeLabel;

  readonly form = this.fb.group({
    responsableId: [this.data.espace?.responsableId ?? '', this.data.responsables ? Validators.required : []],
    nom: [this.data.espace?.nom ?? '', Validators.required],
    capacite: [this.data.espace?.capacite || null as number | null, [Validators.required, Validators.min(1)]],
    categorie: [categoryValue(this.data.espace?.categorie), Validators.required],
    type: [this.data.espace?.type ?? '', Validators.required],
  });

  readonly equipments = signal<string[]>([...(this.data.espace?.equipement ?? [])]);
  readonly equipmentOptions = signal<string[]>([...new Set([...COMMON_EQUIPMENTS, ...this.equipments()])]);

  types(): string[] {
    const list = typesOf(this.form.controls.categorie.value);
    const current = this.form.controls.type.value;
    // Keep a type stored by older data even if it is not in the list
    return current && !list.includes(current) ? [current, ...list] : list;
  }

  hasEquipment(eq: string): boolean {
    return this.equipments().includes(eq);
  }

  toggleEquipment(eq: string): void {
    this.equipments.update(list => (list.includes(eq) ? list.filter(e => e !== eq) : [...list, eq]));
  }

  addEquipment(input: HTMLInputElement): void {
    const eq = input.value.trim();
    if (!eq) return;
    const existing = this.equipmentOptions().find(o => o.toLowerCase() === eq.toLowerCase());
    if (!existing) this.equipmentOptions.update(list => [...list, eq]);
    if (!this.hasEquipment(existing ?? eq)) this.toggleEquipment(existing ?? eq);
    input.value = '';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const value: SpaceFormValue = {
      nom: v.nom.trim(),
      capacite: Number(v.capacite),
      categorie: v.categorie,
      type: v.type,
      equipement: this.equipments(),
    };
    if (this.data.responsables) value.responsableId = v.responsableId;
    this.ref.close(value);
  }
}

@Injectable({ providedIn: 'root' })
export class SpaceFormService {
  private readonly dialog = inject(MatDialog);

  /** Emits the form value, or undefined if cancelled. */
  open(data: SpaceFormData = {}): Observable<SpaceFormValue | undefined> {
    return this.dialog
      .open<SpaceFormDialogComponent, SpaceFormData, SpaceFormValue>(SpaceFormDialogComponent, {
        data,
        width: '640px',
        maxWidth: '94vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed();
  }
}
