<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/favicon.svg';
	import github from '$lib/images/github.svg';
</script>

<header>
	<nav class="navbar navbar-expand-lg">
		<div class="container-fluid">
			<div class="logo-row">
				<div class="corner">
					<a href="https://groundtruth.app/">
						<img src={logo} alt="Ground Truth Data Inc." />
					</a>
				</div>
				<h2 class="mb-0">Fir Sure</h2>
			</div>

			<ul class="navbar-nav mx-auto">
				<li class="nav-item">
					<a
						href="/"
						class="nav-link {page.url.pathname === '/' ? 'active' : ''}"
						aria-current={page.url.pathname === '/' ? 'page' : undefined}
					>
						HOME
					</a>
				</li>
				<li class="nav-item">
					<a
						href="/about"
						class="nav-link {page.url.pathname === '/about' ? 'active' : ''}"
						aria-current={page.url.pathname === '/about' ? 'page' : undefined}
					>
						ABOUT
					</a>
				</li>
				<li class="nav-item">
					<a
						href="/dashboard"
						class="nav-link {page.url.pathname === '/dashboard' ? 'active' : ''}"
						aria-current={page.url.pathname === '/dashboard' ? 'page' : undefined}
					>
						DASHBOARD
					</a>
				</li>
				<li class="nav-item">
					<a
						href="/firsure"
						class="nav-link {page.url.pathname.startsWith('/firsure') ? 'active' : ''}"
						aria-current={page.url.pathname.startsWith('/firsure') ? 'page' : undefined}
					>
						MAP 🌲️🌳️
					</a>
				</li>
			</ul>

			<div class="corner">
				<a href="https://github.com/Ground-Truth-Data/FirSure">
					<img src={github} alt="GitHub" />
				</a>
			</div>
		</div>
	</nav>
</header>
