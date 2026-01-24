export class RouteModel {
    constructor(
        public id: number,
        public date: string,
        public name: string,
        public startPoint: string,
        public description: string,
        public distanceKm: number,
        public distanceM: number,
        public elevationGain: number,           
        public maxHeight: number,
        public minHeight: number,
        public estimatedDurationHours: number,
        public estimatedDurationMinutes: number,
        public type: number,
        public difficulty: string,
        public signUpLink?: string,
        public wikilocLink?: string,     
        public wikilocMapLink?: string,
        public userId?: number,
        public fileTrack?: string,
        public filenameTrack?: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ) {}

    // Getter para compatibilidad con formato HH:MM
    get estimatedDuration(): string {
        if (this.estimatedDurationHours === undefined || this.estimatedDurationMinutes === undefined) {
            return '';
        }
        const hours = this.estimatedDurationHours.toString().padStart(2, '0');
        const minutes = this.estimatedDurationMinutes.toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Setter para compatibilidad con formato HH:MM
    set estimatedDuration(duration: string) {
        if (!duration) {
            this.estimatedDurationHours = 0;
            this.estimatedDurationMinutes = 0;
            return;
        }
        const parts = duration.split(':');
        this.estimatedDurationHours = parseInt(parts[0]) || 0;
        this.estimatedDurationMinutes = parseInt(parts[1]) || 0;
    }

    // Helper method to check if route has an attached file
    get hasAttachedFile(): boolean {
        // Support both camelCase and snake_case field names for compatibility
        const fileTrack = this.fileTrack || (this as any)['file_track'];
        return !!(fileTrack && fileTrack.trim() !== '');
    }
}

// Re-export file attachment interfaces for convenience
export * from './file-attachment.model';
