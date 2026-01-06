import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'reverse' })

/**
 * Inversión del orden de Un array de objetos
 */
export class ReversePipe implements PipeTransform {
    transform(value) {
        const reverse = value.slice().reverse();
        return reverse;
    }
}
