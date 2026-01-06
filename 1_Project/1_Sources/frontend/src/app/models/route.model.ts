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
        public wikilocMapLink?: string   
    ) {}
}
