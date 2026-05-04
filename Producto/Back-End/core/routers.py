class VamosRouter:
    """
    Un enrutador para controlar todas las operaciones de base de datos
    y enviar los modelos de 'eventos' a su propia base de datos.
    """
    route_app_labels = {'eventos'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'eventos_db'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'eventos_db'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        # Permite relaciones solo si ambas tablas están en la misma base de datos
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True if obj1._meta.app_label == obj2._meta.app_label else False
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Asegura que las tablas de eventos solo se creen en la BD de eventos
        if app_label in self.route_app_labels:
            return db == 'eventos_db'
        return db == 'default'