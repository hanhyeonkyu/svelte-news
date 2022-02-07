
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Comment.svelte generated by Svelte v3.46.4 */

    const file$4 = "src/Comment.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (11:2) {#each comment.comments as child}
    function create_each_block$2(ctx) {
    	let comment_1;
    	let current;

    	comment_1 = new Comment({
    			props: { comment: /*child*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(comment_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(comment_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_1_changes = {};
    			if (dirty & /*comment*/ 1) comment_1_changes.comment = /*child*/ ctx[1];
    			comment_1.$set(comment_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(comment_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(11:2) {#each comment.comments as child}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let article;
    	let p;
    	let t0_value = /*comment*/ ctx[0].user + "";
    	let t0;
    	let t1;
    	let t2_value = /*comment*/ ctx[0].time_ago + "";
    	let t2;
    	let t3;
    	let html_tag;
    	let raw_value = /*comment*/ ctx[0].content + "";
    	let t4;
    	let div;
    	let current;
    	let each_value = /*comment*/ ctx[0].comments;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			article = element("article");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			html_tag = new HtmlTag();
    			t4 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "meta svelte-1v1ma1k");
    			add_location(p, file$4, 5, 1, 52);
    			html_tag.a = t4;
    			attr_dev(div, "class", "replies svelte-1v1ma1k");
    			add_location(div, file$4, 9, 1, 134);
    			attr_dev(article, "class", "svelte-1v1ma1k");
    			add_location(article, file$4, 4, 0, 41);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(article, t3);
    			html_tag.m(raw_value, article);
    			append_dev(article, t4);
    			append_dev(article, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*comment*/ 1) && t0_value !== (t0_value = /*comment*/ ctx[0].user + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*comment*/ 1) && t2_value !== (t2_value = /*comment*/ ctx[0].time_ago + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*comment*/ 1) && raw_value !== (raw_value = /*comment*/ ctx[0].content + "")) html_tag.p(raw_value);

    			if (dirty & /*comment*/ 1) {
    				each_value = /*comment*/ ctx[0].comments;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Comment', slots, []);
    	let { comment } = $$props;
    	const writable_props = ['comment'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Comment> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('comment' in $$props) $$invalidate(0, comment = $$props.comment);
    	};

    	$$self.$capture_state = () => ({ comment });

    	$$self.$inject_state = $$props => {
    		if ('comment' in $$props) $$invalidate(0, comment = $$props.comment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [comment];
    }

    class Comment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { comment: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comment",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*comment*/ ctx[0] === undefined && !('comment' in props)) {
    			console.warn("<Comment> was created without expected prop 'comment'");
    		}
    	}

    	get comment() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comment(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Item.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/Item.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (15:2) {#if item.domain}
    function create_if_block$2(ctx) {
    	let small;
    	let t_value = /*item*/ ctx[0].domain + "";
    	let t;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t = text(t_value);
    			add_location(small, file$3, 15, 3, 295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].domain + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(15:2) {#if item.domain}",
    		ctx
    	});

    	return block;
    }

    // (24:1) {#each item.comments as comment}
    function create_each_block$1(ctx) {
    	let comment;
    	let current;

    	comment = new Comment({
    			props: { comment: /*comment*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(comment.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(comment, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_changes = {};
    			if (dirty & /*item*/ 1) comment_changes.comment = /*comment*/ ctx[3];
    			comment.$set(comment_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(comment, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(24:1) {#each item.comments as comment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let a0;
    	let t0;
    	let t1;
    	let article;
    	let a1;
    	let h1;
    	let t2_value = /*item*/ ctx[0].title + "";
    	let t2;
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let t6_value = /*item*/ ctx[0].user + "";
    	let t6;
    	let t7;
    	let t8_value = /*item*/ ctx[0].time_ago + "";
    	let t8;
    	let t9;
    	let div;
    	let current;
    	let if_block = /*item*/ ctx[0].domain && create_if_block$2(ctx);
    	let each_value = /*item*/ ctx[0].comments;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			t0 = text("« back");
    			t1 = space();
    			article = element("article");
    			a1 = element("a");
    			h1 = element("h1");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			p = element("p");
    			t5 = text("submitted by ");
    			t6 = text(t6_value);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a0, "href", /*returnTo*/ ctx[1]);
    			attr_dev(a0, "class", "svelte-106zs3f");
    			add_location(a0, file$3, 9, 0, 183);
    			attr_dev(h1, "class", "svelte-106zs3f");
    			add_location(h1, file$3, 13, 2, 250);
    			attr_dev(a1, "href", /*url*/ ctx[2]);
    			attr_dev(a1, "class", "svelte-106zs3f");
    			add_location(a1, file$3, 12, 1, 231);
    			attr_dev(p, "class", "meta");
    			add_location(p, file$3, 19, 1, 340);
    			attr_dev(article, "class", "svelte-106zs3f");
    			add_location(article, file$3, 11, 0, 220);
    			attr_dev(div, "class", "comments");
    			add_location(div, file$3, 22, 0, 409);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, article, anchor);
    			append_dev(article, a1);
    			append_dev(a1, h1);
    			append_dev(h1, t2);
    			append_dev(a1, t3);
    			if (if_block) if_block.m(a1, null);
    			append_dev(article, t4);
    			append_dev(article, p);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*returnTo*/ 2) {
    				attr_dev(a0, "href", /*returnTo*/ ctx[1]);
    			}

    			if ((!current || dirty & /*item*/ 1) && t2_value !== (t2_value = /*item*/ ctx[0].title + "")) set_data_dev(t2, t2_value);

    			if (/*item*/ ctx[0].domain) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(a1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*url*/ 4) {
    				attr_dev(a1, "href", /*url*/ ctx[2]);
    			}

    			if ((!current || dirty & /*item*/ 1) && t6_value !== (t6_value = /*item*/ ctx[0].user + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*item*/ 1) && t8_value !== (t8_value = /*item*/ ctx[0].time_ago + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].comments;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let url;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Item', slots, []);
    	let { item } = $$props;
    	let { returnTo } = $$props;
    	const writable_props = ['item', 'returnTo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('returnTo' in $$props) $$invalidate(1, returnTo = $$props.returnTo);
    	};

    	$$self.$capture_state = () => ({ Comment, item, returnTo, url });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('returnTo' in $$props) $$invalidate(1, returnTo = $$props.returnTo);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(2, url = !item.domain
    			? `https://news.ycombinator.com/${item.url}`
    			: item.url);
    		}
    	};

    	return [item, returnTo, url];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { item: 0, returnTo: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*returnTo*/ ctx[1] === undefined && !('returnTo' in props)) {
    			console.warn("<Item> was created without expected prop 'returnTo'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnTo() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnTo(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Summary.svelte generated by Svelte v3.46.4 */

    const file$2 = "src/Summary.svelte";

    function create_fragment$2(ctx) {
    	let article;
    	let span;
    	let t0_value = /*i*/ ctx[1] + /*offset*/ ctx[2] + 1 + "";
    	let t0;
    	let t1;
    	let h2;
    	let a0;
    	let t2_value = /*item*/ ctx[0].title + "";
    	let t2;
    	let t3;
    	let p;
    	let a1;
    	let t4_value = /*comment_text*/ ctx[4]() + "";
    	let t4;
    	let a1_href_value;
    	let t5;
    	let t6_value = /*item*/ ctx[0].user + "";
    	let t6;
    	let t7;
    	let t8_value = /*item*/ ctx[0].time_ago + "";
    	let t8;

    	const block = {
    		c: function create() {
    			article = element("article");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = text(" by ");
    			t6 = text(t6_value);
    			t7 = space();
    			t8 = text(t8_value);
    			attr_dev(span, "class", "svelte-205jx5");
    			add_location(span, file$2, 15, 2, 304);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", /*url*/ ctx[3]);
    			attr_dev(a0, "class", "svelte-205jx5");
    			add_location(a0, file$2, 16, 6, 340);
    			attr_dev(h2, "class", "svelte-205jx5");
    			add_location(h2, file$2, 16, 2, 336);
    			attr_dev(a1, "href", a1_href_value = "#/item/" + /*item*/ ctx[0].id);
    			attr_dev(a1, "class", "svelte-205jx5");
    			add_location(a1, file$2, 18, 4, 415);
    			attr_dev(p, "class", "meta");
    			add_location(p, file$2, 17, 2, 394);
    			attr_dev(article, "class", "svelte-205jx5");
    			add_location(article, file$2, 14, 0, 292);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, span);
    			append_dev(span, t0);
    			append_dev(article, t1);
    			append_dev(article, h2);
    			append_dev(h2, a0);
    			append_dev(a0, t2);
    			append_dev(article, t3);
    			append_dev(article, p);
    			append_dev(p, a1);
    			append_dev(a1, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i, offset*/ 6 && t0_value !== (t0_value = /*i*/ ctx[1] + /*offset*/ ctx[2] + 1 + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*item*/ ctx[0].title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*url*/ 8) {
    				attr_dev(a0, "href", /*url*/ ctx[3]);
    			}

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "#/item/" + /*item*/ ctx[0].id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*item*/ ctx[0].user + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*item*/ 1 && t8_value !== (t8_value = /*item*/ ctx[0].time_ago + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let url;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Summary', slots, []);
    	let { item } = $$props;
    	let { i } = $$props;
    	let { offset } = $$props;

    	function comment_text() {
    		const c = item.comments_count;
    		return `${c} ${c === 1 ? "comment" : "comments"}`;
    	}

    	const writable_props = ['item', 'i', 'offset'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    	};

    	$$self.$capture_state = () => ({ item, i, offset, comment_text, url });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    		if ('url' in $$props) $$invalidate(3, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(3, url = item.type === "ask"
    			? `https://news.ycombinator.com/${item.url}`
    			: item.url);
    		}
    	};

    	return [item, i, offset, url, comment_text];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0, i: 1, offset: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Summary> was created without expected prop 'item'");
    		}

    		if (/*i*/ ctx[1] === undefined && !('i' in props)) {
    			console.warn("<Summary> was created without expected prop 'i'");
    		}

    		if (/*offset*/ ctx[2] === undefined && !('offset' in props)) {
    			console.warn("<Summary> was created without expected prop 'offset'");
    		}
    	}

    	get item() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/List.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (33:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading...";
    			attr_dev(p, "class", "loading svelte-uhreba");
    			add_location(p, file$1, 33, 2, 721);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(33:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if items}
    function create_if_block$1(ctx) {
    	let t0;
    	let div1;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let a;
    	let t4_value = /*page*/ ctx[0] + 1 + "";
    	let t4;
    	let a_href_value;
    	let current;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = (/*page*/ ctx[0] - 1 > 1
    	? /*page*/ ctx[0] - 1
    	: 1 !== /*page*/ ctx[0]) && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			div0 = element("div");
    			t2 = text(/*page*/ ctx[0]);
    			t3 = space();
    			a = element("a");
    			t4 = text(t4_value);
    			attr_dev(div0, "class", "curPageNum svelte-uhreba");
    			add_location(div0, file$1, 29, 4, 619);
    			attr_dev(a, "href", a_href_value = "#/top/" + (/*page*/ ctx[0] + 1));
    			attr_dev(a, "class", "svelte-uhreba");
    			add_location(a, file$1, 30, 4, 660);
    			attr_dev(div1, "class", "pageNums svelte-uhreba");
    			add_location(div1, file$1, 23, 2, 433);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, a);
    			append_dev(a, t4);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, offset*/ 6) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*page*/ ctx[0] - 1 > 1
    			? /*page*/ ctx[0] - 1
    			: 1 !== /*page*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div1, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*page*/ 1) set_data_dev(t2, /*page*/ ctx[0]);
    			if ((!current || dirty & /*page*/ 1) && t4_value !== (t4_value = /*page*/ ctx[0] + 1 + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*page*/ 1 && a_href_value !== (a_href_value = "#/top/" + (/*page*/ ctx[0] + 1))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(20:0) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#each items as item, i}
    function create_each_block(ctx) {
    	let summary;
    	let current;

    	summary = new Summary({
    			props: {
    				item: /*item*/ ctx[3],
    				i: /*i*/ ctx[5],
    				offset: /*offset*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(summary.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(summary, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const summary_changes = {};
    			if (dirty & /*items*/ 2) summary_changes.item = /*item*/ ctx[3];
    			if (dirty & /*offset*/ 4) summary_changes.offset = /*offset*/ ctx[2];
    			summary.$set(summary_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(summary.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(summary, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(21:2) {#each items as item, i}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if page - 1 > 1 ? page - 1 : 1 !== page}
    function create_if_block_1$1(ctx) {
    	let a;
    	let t_value = (/*page*/ ctx[0] - 1 > 1 ? /*page*/ ctx[0] - 1 : 1) + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#/top/" + (/*page*/ ctx[0] - 1 > 1 ? /*page*/ ctx[0] - 1 : 1));
    			attr_dev(a, "class", "svelte-uhreba");
    			add_location(a, file$1, 25, 6, 509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*page*/ 1 && t_value !== (t_value = (/*page*/ ctx[0] - 1 > 1 ? /*page*/ ctx[0] - 1 : 1) + "")) set_data_dev(t, t_value);

    			if (dirty & /*page*/ 1 && a_href_value !== (a_href_value = "#/top/" + (/*page*/ ctx[0] - 1 > 1 ? /*page*/ ctx[0] - 1 : 1))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(25:4) {#if page - 1 > 1 ? page - 1 : 1 !== page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const PAGE_SIZE = 20;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	let { page } = $$props;
    	let items;
    	let offset;
    	const writable_props = ['page'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ Summary, PAGE_SIZE, page, items, offset });

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*page*/ 1) {
    			fetch(`https://node-hnapi.herokuapp.com/news?page=${page}`).then(r => r.json()).then(data => {
    				$$invalidate(1, items = data);
    				$$invalidate(2, offset = PAGE_SIZE * (page - 1));
    				window.scrollTo(0, 0);
    			});
    		}
    	};

    	return [page, items, offset];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !('page' in props)) {
    			console.warn("<List> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    const { window: window_1 } = globals;
    const file = "src/App.svelte";

    // (35:17) 
    function create_if_block_1(ctx) {
    	let list;
    	let current;

    	list = new List({
    			props: { page: /*page*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(list.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};
    			if (dirty & /*page*/ 2) list_changes.page = /*page*/ ctx[1];
    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(35:17) ",
    		ctx
    	});

    	return block;
    }

    // (33:2) {#if item}
    function create_if_block(ctx) {
    	let item_1;
    	let current;

    	item_1 = new Item({
    			props: {
    				item: /*item*/ ctx[0],
    				returnTo: "#/top/" + /*page*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(item_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item_1_changes = {};
    			if (dirty & /*item*/ 1) item_1_changes.item = /*item*/ ctx[0];
    			if (dirty & /*page*/ 2) item_1_changes.returnTo = "#/top/" + /*page*/ ctx[1];
    			item_1.$set(item_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:2) {#if item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[0]) return 0;
    		if (/*page*/ ctx[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-1c6c25x");
    			add_location(main, file, 31, 0, 695);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "hashchange", /*hashchange*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let item;
    	let page;

    	async function hashchange() {
    		// the poor man's router!
    		const path = window.location.hash.slice(1);

    		if (path.startsWith("/item")) {
    			const id = path.slice(6);
    			$$invalidate(0, item = await fetch(`https://node-hnapi.herokuapp.com/item/${id}`).then(r => r.json()));
    			window.scrollTo(0, 0);
    		} else if (path.startsWith("/top")) {
    			$$invalidate(1, page = +path.slice(5));
    			$$invalidate(0, item = null);
    		} else {
    			window.location.hash = "/top/1";
    		}
    	}

    	onMount(hashchange);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Item,
    		List,
    		item,
    		page,
    		hashchange
    	});

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('page' in $$props) $$invalidate(1, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, page, hashchange];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
