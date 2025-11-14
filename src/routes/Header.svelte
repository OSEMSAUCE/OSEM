<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/favicon.svg';
	import github from '$lib/images/github.svg';
</script>

<header>
	<div class="logo-row">
		<div class="corner">
			<a href="https://groundtruth.app/">
				<img src={logo} alt="Ground Truth Data Inc." />
			</a>
		</div>
		<h2>Fir Sure</h2>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>

		<ul>
			<li aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">HOME</a>
			</li>
			<li aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">ABOUT</a>
			</li>
			<li aria-current={page.url.pathname === '/dashboard' ? 'page' : undefined}>
				<a href="/dashboard">DASHBOARD</a>
			</li>
			<li aria-current={page.url.pathname.startsWith('/firsure') ? 'page' : undefined}>
				<a href="/firsure">MAP 🌲️🌳️ </a>
			</li>
			

			
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<a href="https://github.com/Ground-Truth-Data/FirSure">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>
