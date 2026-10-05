package com.moeda_estudantil.moeda.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Usado pelo frontend para saber se ja existe uma sessao autenticada
 * (ex.: ao recarregar a pagina) e qual o tipo do usuario logado. Rota
 * protegida como qualquer outra em SecurityConfig -- sem sessao valida,
 * retorna 401 antes mesmo de chegar aqui.
 */
@RestController
public class AuthController {

    @GetMapping("/api/me")
    public Map<String, String> me(Authentication authentication) {
        String tipo = authentication.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .map(autoridade -> autoridade.replace("ROLE_", ""))
                .orElse("");
        return Map.of("login", authentication.getName(), "tipo", tipo);
    }
}
