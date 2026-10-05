package com.moeda_estudantil.moeda.security;

import com.moeda_estudantil.moeda.model.Usuario;
import com.moeda_estudantil.moeda.repository.UsuarioRepository;
import org.hibernate.Hibernate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Autentica qualquer Usuario pelo login/senha cadastrados. O papel (role) e
 * derivado do tipo concreto (Aluno -> ALUNO, Professor -> PROFESSOR,
 * EmpresaParceira -> EMPRESAPARCEIRA), para dar suporte a autorizacao por
 * tipo de usuario com @PreAuthorize("hasRole('...')").
 */
@Service
public class UsuarioUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByLogin(login)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado: " + login));

        return User.builder()
                .username(usuario.getLogin())
                .password(usuario.getSenha())
                .roles(papel(usuario))
                .build();
    }

    private String papel(Usuario usuario) {
        return Hibernate.getClass(usuario).getSimpleName().toUpperCase(Locale.ROOT);
    }
}
