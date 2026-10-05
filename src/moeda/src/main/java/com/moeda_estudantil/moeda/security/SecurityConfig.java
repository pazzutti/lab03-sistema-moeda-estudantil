package com.moeda_estudantil.moeda.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Backend e API REST pura (sem paginas server-side): login/logout/erros
 * respondem com JSON simples, sem redirect nem stack trace, para o frontend
 * consumir via fetch. Tudo exige sessao autenticada, exceto as rotas de
 * cadastro (liberar aqui conforme forem criadas) e o console do H2.
 *
 * CSRF fica desligado porque nao ha formularios server-side gerando o
 * token automaticamente; a autenticacao continua exigida via cookie de sessao.
 *
 * Os erros aqui escrevem a resposta diretamente (em vez de response.sendError
 * ou deixar a excecao propagar) para nunca passar pelo BasicErrorController
 * padrao do Spring Boot, que inclui a stack trace no corpo JSON.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                // O console do H2 roda dentro de um <frame>; sem isso o navegador bloqueia.
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .successHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT))
                        .failureHandler((request, response, exception) ->
                                escreverErro(response, HttpStatus.UNAUTHORIZED, "Login ou senha invalidos"))
                        .permitAll())
                .logout(logout -> logout
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT))
                        .permitAll())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                escreverErro(response, HttpStatus.UNAUTHORIZED, "Autenticacao necessaria"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                escreverErro(response, HttpStatus.FORBIDDEN, "Acesso negado")));

        return http.build();
    }

    private void escreverErro(HttpServletResponse response, HttpStatus status, String mensagem) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"mensagem\":\"" + mensagem + "\"}");
    }
}
