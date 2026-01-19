import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.css']
})
export class RouteFormComponent implements OnInit, OnDestroy {

  public routeForm: FormGroup;
  public loading: boolean = false;
  public saving: boolean = false;
  public isEditMode: boolean = false;
  public routeId: number | null = null;
  public errorMessage: string = '';

  public difficulties = [
    { label: 'Seleccionar dificultad', value: '' },
    { label: 'Fácil', value: 'Fácil' },
    { label: 'Moderada', value: 'Moderada' },
    { label: 'Difícil', value: 'Difícil' },
    { label: 'Muy Difícil', value: 'Muy Difícil' }
  ];

  public routeTypes = [
    { label: 'Seleccionar tipo', value: null },
    { label: 'Circular', value: 1 },
    { label: 'Lineal', value: 2 },
    { label: 'Travesía', value: 3 }
  ];

  private subscriptions: Subscription[] = [];
  private title: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private titleShareService: TitleShareService,
    private routeService: RouteService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkRouteMode();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.routeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      date: ['', Validators.required],
      start_point: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      distance_km: ['', [Validators.min(0.1), Validators.max(999.99)]],
      elevation_gain: ['', [Validators.min(0)]],
      max_height: ['', [Validators.min(0)]],
      min_height: ['', [Validators.min(0)]],
      estimated_duration: ['', Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)],
      type: [null],
      difficulty: [''],
      sign_up_link: ['', Validators.maxLength(255)],
      wikiloc_link: ['', Validators.maxLength(255)],
      wikiloc_map_link: ['', Validators.maxLength(255)]
    });
  }

  private checkRouteMode(): void {
    this.routeId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.routeId;
    
    if (this.isEditMode) {
      this.title = 'Editar Ruta';
      this.loadRoute();
    } else {
      this.title = 'Nueva Ruta';
      // Establecer fecha por defecto a hoy
      const today = new Date().toISOString().split('T')[0];
      this.routeForm.patchValue({ date: today });
    }
    
    this.changeTitle();
  }

  private setupSubscriptions(): void {
    // Suscripción para obtener ruta específica
    const getRouteSub = this.routeService.onGetRoute().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          this.populateForm(response.data);
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar la ruta';
        console.error('Error loading route:', error);
      }
    );

    // Suscripción para crear ruta
    const addRouteSub = this.routeService.onAddRoute().subscribe(
      (response: any) => {
        this.saving = false;
        if (response.data) {
          console.log('Route created successfully:', response);
          this.router.navigate(['/routes']);
        }
      },
      (error) => {
        this.saving = false;
        this.errorMessage = 'Error al crear la ruta';
        console.error('Error creating route:', error);
      }
    );

    // Suscripción para editar ruta
    const editRouteSub = this.routeService.onEditRoute().subscribe(
      (response: any) => {
        this.saving = false;
        if (response.data) {
          console.log('Route updated successfully:', response);
          this.router.navigate(['/routes']);
        }
      },
      (error) => {
        this.saving = false;
        this.errorMessage = 'Error al actualizar la ruta';
        console.error('Error updating route:', error);
      }
    );

    this.subscriptions.push(getRouteSub, addRouteSub, editRouteSub);
  }

  private loadRoute(): void {
    if (this.routeId) {
      this.loading = true;
      this.routeService.getRoute(this.routeId);
    }
  }

  private populateForm(route: any): void {
    // Convertir fecha al formato requerido por input date
    let formattedDate = '';
    if (route.date) {
      const date = new Date(route.date);
      formattedDate = date.toISOString().split('T')[0];
    }

    this.routeForm.patchValue({
      name: route.name || '',
      date: formattedDate,
      start_point: route.start_point || '',
      description: route.description || '',
      distance_km: route.distance_km || '',
      elevation_gain: route.elevation_gain || '',
      max_height: route.max_height || '',
      min_height: route.min_height || '',
      estimated_duration: route.estimated_duration || '',
      type: route.type || null,
      difficulty: route.difficulty || '',
      sign_up_link: route.sign_up_link || '',
      wikiloc_link: route.wikiloc_link || '',
      wikiloc_map_link: route.wikiloc_map_link || ''
    });
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  onSubmit(): void {
    if (this.routeForm.valid) {
      this.saving = true;
      this.errorMessage = '';
      
      const formData = { ...this.routeForm.value };
      
      // Convertir valores numéricos
      if (formData.distance_km) formData.distance_km = parseFloat(formData.distance_km);
      if (formData.elevation_gain) formData.elevation_gain = parseInt(formData.elevation_gain);
      if (formData.max_height) formData.max_height = parseInt(formData.max_height);
      if (formData.min_height) formData.min_height = parseInt(formData.min_height);
      
      if (this.isEditMode && this.routeId) {
        formData.id = this.routeId;
        this.routeService.editRoute(formData);
      } else {
        this.routeService.addRoute(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
    }
  }

  onCancel(): void {
    this.router.navigate(['/routes']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.routeForm.controls).forEach(key => {
      const control = this.routeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Getters para validaciones en template
  get name() { return this.routeForm.get('name'); }
  get date() { return this.routeForm.get('date'); }
  get start_point() { return this.routeForm.get('start_point'); }
  get description() { return this.routeForm.get('description'); }
  get distance_km() { return this.routeForm.get('distance_km'); }
  get elevation_gain() { return this.routeForm.get('elevation_gain'); }
  get max_height() { return this.routeForm.get('max_height'); }
  get min_height() { return this.routeForm.get('min_height'); }
  get estimated_duration() { return this.routeForm.get('estimated_duration'); }
  get sign_up_link() { return this.routeForm.get('sign_up_link'); }
  get wikiloc_link() { return this.routeForm.get('wikiloc_link'); }
  get wikiloc_map_link() { return this.routeForm.get('wikiloc_map_link'); }

  // Métodos de utilidad para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.routeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.routeForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es obligatorio`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} debe ser menor a ${field.errors['max'].max}`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Nombre',
      'date': 'Fecha',
      'start_point': 'Punto de inicio',
      'description': 'Descripción',
      'distance_km': 'Distancia',
      'elevation_gain': 'Desnivel positivo',
      'max_height': 'Altura máxima',
      'min_height': 'Altura mínima',
      'estimated_duration': 'Duración estimada',
      'sign_up_link': 'Enlace de inscripción',
      'wikiloc_link': 'Enlace Wikiloc',
      'wikiloc_map_link': 'Enlace mapa Wikiloc'
    };
    return labels[fieldName] || fieldName;
  }
}