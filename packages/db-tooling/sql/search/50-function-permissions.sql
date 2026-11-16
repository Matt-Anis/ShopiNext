ALTER FUNCTION admin.enqueue_search_entity(text, text) OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_entity() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_product_dependency() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.enqueue_search_category_products(uuid) OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_category_change() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_category_delete() OWNER TO search_outbox_writer;

REVOKE ALL ON FUNCTION admin.enqueue_search_entity(text, text)
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_entity()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_product_dependency()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.enqueue_search_category_products(uuid)
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_category_change()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_category_delete()
FROM PUBLIC, client_app, admin_app, search_worker;
