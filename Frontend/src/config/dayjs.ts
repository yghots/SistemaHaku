import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configuracion global de Day.js (unica libreria de fechas del proyecto).
// Se importa una sola vez, como efecto secundario, al inicio de main.ts.
dayjs.extend(relativeTime);
dayjs.locale('es');
