import { TableroView } from './view/TableroView.js';
import { JuegoController } from './controller/JuegoController.js';

new JuegoController(new TableroView(document)).iniciar();
